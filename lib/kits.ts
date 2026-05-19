// Shared types + helpers for the kits table.
// A "kit" is one media kit (one public URL). Each user can have many.

export type Kit = {
  id: string;
  user_id: string;
  /** Public-URL slug — globally unique. */
  slug: string | null;
  /** Friendly name shown in the kit list (e.g. "Tech brand kit"). */
  name: string | null;
  is_published: boolean;
  theme: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

/** Format check matching the DB-side check constraint on kits.slug. */
export const SLUG_RE = /^[a-z0-9_-]{3,30}$/;

/** Reserved slugs that conflict with app routes or brand. Matches the DB CHECK. */
export const RESERVED_SLUGS = new Set([
  "admin", "api", "app", "auth", "callback", "login", "signup",
  "signin", "logout", "logoff", "reset", "dashboard", "settings",
  "help", "about", "contact", "pricing", "terms", "privacy", "tos",
  "support", "docs", "blog", "home", "index", "www", "mail",
  "media", "mediakit", "kit", "kits", "profile", "profiles",
  "user", "users", "oink", "mycard", "card", "cards", "static",
  "public", "assets", "images", "img", "css", "js",
]);
