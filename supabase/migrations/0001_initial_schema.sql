-- Initial schema for the mycard.to media kit app.
-- Three tables: profiles (account identity), kits (one media kit per user),
-- cards (ordered, typed cards inside a kit).
--
-- Run this in the Supabase SQL editor for the "mycard" project.
-- Safe to re-run: every CREATE uses "if not exists" or "or replace".

-- =============================================================================
-- profiles: 1:1 with auth.users, holds account-level identity.
-- =============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 3–30 chars, lowercase letters/numbers/_/-
  constraint username_format check (
    username is null or username ~* '^[a-z0-9_-]{3,30}$'
  ),

  -- Reserved usernames that conflict with app routes or brand names.
  constraint username_reserved check (
    username is null or username not in (
      'admin', 'api', 'app', 'auth', 'callback', 'login', 'signup',
      'signin', 'logout', 'logoff', 'reset', 'dashboard', 'settings',
      'help', 'about', 'contact', 'pricing', 'terms', 'privacy', 'tos',
      'support', 'docs', 'blog', 'home', 'index', 'www', 'mail',
      'media', 'mediakit', 'kit', 'kits', 'profile', 'profiles',
      'user', 'users', 'oink', 'mycard', 'card', 'cards', 'static',
      'public', 'assets', 'images', 'img', 'css', 'js'
    )
  )
);

-- =============================================================================
-- kits: each user has exactly one media kit (for v1).
-- The "theme" jsonb holds color scheme, font, etc.
-- =============================================================================
create table if not exists public.kits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  is_published boolean not null default true,
  theme jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- cards: ordered, typed cards inside a kit.
-- card_type drives which UI component renders; "data" jsonb holds the fields.
-- =============================================================================
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid not null references public.kits(id) on delete cascade,
  card_type text not null,
  position integer not null default 0,
  is_visible boolean not null default true,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cards_kit_position_idx
  on public.cards (kit_id, position);

-- =============================================================================
-- updated_at trigger — keeps the column fresh on every UPDATE.
-- =============================================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_kits_updated_at on public.kits;
create trigger touch_kits_updated_at
  before update on public.kits
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_cards_updated_at on public.cards;
create trigger touch_cards_updated_at
  before update on public.cards
  for each row execute function public.touch_updated_at();

-- =============================================================================
-- Auto-provision a profile + kit row when a user signs up.
-- Triggered on insert into auth.users (Supabase's auth table).
-- Username stays NULL until the user picks one in the onboarding flow.
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;

  insert into public.kits (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Row Level Security (RLS).
-- profiles + published kits + their cards are PUBLIC READ (for mycard.to/username);
-- everything else is owner-only.
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.kits     enable row level security;
alter table public.cards    enable row level security;

-- profiles: public read, owner write
drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_all
  on public.profiles for select
  using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles for update
  using (auth.uid() = id);

-- kits: published readable by anyone; owner has full control
drop policy if exists kits_select_published_or_own on public.kits;
create policy kits_select_published_or_own
  on public.kits for select
  using (is_published or auth.uid() = user_id);

drop policy if exists kits_insert_own on public.kits;
create policy kits_insert_own
  on public.kits for insert
  with check (auth.uid() = user_id);

drop policy if exists kits_update_own on public.kits;
create policy kits_update_own
  on public.kits for update
  using (auth.uid() = user_id);

drop policy if exists kits_delete_own on public.kits;
create policy kits_delete_own
  on public.kits for delete
  using (auth.uid() = user_id);

-- cards: visible if parent kit is published OR you own it
drop policy if exists cards_select_published_or_own on public.cards;
create policy cards_select_published_or_own
  on public.cards for select
  using (
    exists (
      select 1 from public.kits k
      where k.id = cards.kit_id
        and (k.is_published or k.user_id = auth.uid())
    )
  );

drop policy if exists cards_insert_own on public.cards;
create policy cards_insert_own
  on public.cards for insert
  with check (
    exists (
      select 1 from public.kits k
      where k.id = kit_id and k.user_id = auth.uid()
    )
  );

drop policy if exists cards_update_own on public.cards;
create policy cards_update_own
  on public.cards for update
  using (
    exists (
      select 1 from public.kits k
      where k.id = cards.kit_id and k.user_id = auth.uid()
    )
  );

drop policy if exists cards_delete_own on public.cards;
create policy cards_delete_own
  on public.cards for delete
  using (
    exists (
      select 1 from public.kits k
      where k.id = cards.kit_id and k.user_id = auth.uid()
    )
  );

-- =============================================================================
-- Storage bucket for profile photos + card images.
-- Public read; authenticated users can upload to their own folder.
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('kit-media', 'kit-media', true)
on conflict (id) do nothing;

drop policy if exists "kit_media_public_read"  on storage.objects;
create policy "kit_media_public_read"
  on storage.objects for select
  using (bucket_id = 'kit-media');

drop policy if exists "kit_media_user_upload"  on storage.objects;
create policy "kit_media_user_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'kit-media'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "kit_media_user_update"  on storage.objects;
create policy "kit_media_user_update"
  on storage.objects for update
  using (
    bucket_id = 'kit-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "kit_media_user_delete"  on storage.objects;
create policy "kit_media_user_delete"
  on storage.objects for delete
  using (
    bucket_id = 'kit-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
