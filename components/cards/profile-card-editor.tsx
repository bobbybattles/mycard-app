"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import StarEmblem, { type StarLevel, LEVEL_LABELS } from "./star-emblem";
import { PLATFORMS, PLATFORM_ORDER, type Platform } from "@/lib/platforms";
import PlatformIcon from "./platform-icon";

export type ProfilePlatformLink = {
  id: string;
  platform: Platform;
  /** Optional label (e.g. "Main channel", "Cooking account"). */
  label?: string;
  url: string;
};

// Shape stored in cards.data for card_type = "profile".
export type ProfileCardData = {
  photo_url?: string;
  name?: string;
  bio?: string;
  niche?: string;
  location?: string;
  star_level?: StarLevel;
  /** Optional Amazon Storefront URL. If set, replaces the mycard.to URL on the public kit. */
  amazon_storefront?: string;
  /** Additional platform links (YouTube channels, TikTok, etc.) shown in a "Find me" footer. */
  platform_links?: ProfilePlatformLink[];
};

const STAR_LEVELS: StarLevel[] = ["bronze", "silver", "gold", "platinum"];

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

type Props = {
  userId: string;
  kitId: string;
  // Existing profile card row, if any.
  card: { id: string; data: ProfileCardData; is_visible: boolean } | null;
};

const MAX_PHOTO_MB = 5;

// Editor for the user's Profile card.
// Saves to the cards table (upserts on card_type = "profile" for this kit).
export default function ProfileCardEditor({ userId, kitId, card }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState(card?.data.name ?? "");
  const [bio, setBio] = useState(card?.data.bio ?? "");
  const [location, setLocation] = useState(card?.data.location ?? "");
  const [amazonStorefront, setAmazonStorefront] = useState(
    card?.data.amazon_storefront ?? ""
  );
  const [starLevel, setStarLevel] = useState<StarLevel | "">(
    card?.data.star_level ?? ""
  );
  const [platformLinks, setPlatformLinks] = useState<ProfilePlatformLink[]>(
    () =>
      (card?.data.platform_links ?? []).map((l) => ({
        id: l.id || randomId(),
        platform: l.platform,
        label: l.label,
        url: l.url,
      }))
  );
  const [showPlatformPicker, setShowPlatformPicker] = useState(false);

  function addPlatformLink(platform: Platform) {
    setPlatformLinks((prev) => [
      ...prev,
      { id: randomId(), platform, label: "", url: "" },
    ]);
    setShowPlatformPicker(false);
  }

  function updatePlatformLink(id: string, patch: Partial<ProfilePlatformLink>) {
    setPlatformLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  }

  function removePlatformLink(id: string) {
    setPlatformLinks((prev) => prev.filter((l) => l.id !== id));
  }

  function movePlatformLink(id: string, direction: "up" | "down") {
    setPlatformLinks((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx === -1) return prev;
      const swap = direction === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }
  const [photoUrl, setPhotoUrl] = useState(card?.data.photo_url ?? "");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  // Clear the "Saved" pill after a moment so the user knows next click will save again.
  useEffect(() => {
    if (saveStatus !== "saved") return;
    const t = setTimeout(() => setSaveStatus("idle"), 2500);
    return () => clearTimeout(t);
  }, [saveStatus]);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);

    if (!file.type.startsWith("image/")) {
      setPhotoError("Pick an image file (PNG, JPG, or WebP).");
      return;
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      setPhotoError(`That image is over ${MAX_PHOTO_MB} MB. Try a smaller one.`);
      return;
    }

    setPhotoUploading(true);
    try {
      // Store under <userId>/profile.<ext> so RLS lets the owner write and
      // public read works through the kit-media bucket's policies.
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/profile.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("kit-media")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) {
        setPhotoError(uploadErr.message);
        return;
      }
      const { data: pub } = supabase.storage.from("kit-media").getPublicUrl(path);
      // Cache-bust so the new image shows immediately after upload.
      setPhotoUrl(`${pub.publicUrl}?v=${Date.now()}`);
    } finally {
      setPhotoUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaveStatus("idle");

    // Light normalization: if user typed a URL without a protocol, add https://
    const cleanedStorefront = (() => {
      const v = amazonStorefront.trim();
      if (!v) return undefined;
      if (/^https?:\/\//i.test(v)) return v;
      return `https://${v}`;
    })();

    const cleanedPlatformLinks = platformLinks
      .map((l) => {
        const url = l.url.trim();
        const withProtocol =
          !url || /^https?:\/\//i.test(url) ? url : `https://${url}`;
        return {
          id: l.id,
          platform: l.platform,
          label: l.label?.trim() || undefined,
          url: withProtocol,
        };
      })
      .filter((l) => l.url.length > 0);

    const data: ProfileCardData = {
      // Preserve any existing niche on the card so a future "Niche" field can re-read it.
      ...(card?.data.niche ? { niche: card.data.niche } : {}),
      photo_url: photoUrl || undefined,
      name: name.trim() || undefined,
      bio: bio.trim() || undefined,
      location: location.trim() || undefined,
      star_level: starLevel || undefined,
      amazon_storefront: cleanedStorefront,
      platform_links:
        cleanedPlatformLinks.length > 0 ? cleanedPlatformLinks : undefined,
    };

    startSave(async () => {
      const { error } = await supabase.from("cards").upsert(
        {
          kit_id: kitId,
          card_type: "profile",
          position: 0,
          is_visible: true,
          data,
        },
        { onConflict: "kit_id,card_type" }
      );
      if (error) {
        setSaveStatus("error");
        setSaveError(error.message);
        return;
      }
      setSaveStatus("saved");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-semibold text-lg text-slate-900">Profile card</h2>
          <p className="text-sm text-slate-600">
            The header card every brand sees first.
          </p>
        </div>
        {saveStatus === "saved" && (
          <span className="text-sm rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1">
            Saved ✓
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-shrink-0">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Profile photo
          </label>
          <div className="flex items-center gap-3">
            <div className="relative h-24 w-24 rounded-full bg-pink-100 overflow-hidden flex items-center justify-center text-3xl font-bold text-pink-600">
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt="Profile"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                (name[0] || "?").toUpperCase()
              )}
            </div>
            <label className="cursor-pointer text-sm rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-50">
              {photoUploading ? "Uploading…" : photoUrl ? "Replace" : "Upload"}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={photoUploading}
                className="hidden"
              />
            </label>
          </div>
          {photoError && (
            <p className="mt-2 text-sm text-red-600">{photoError}</p>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <Field label="Name" hint="Your name or creator handle">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Creator"
              maxLength={80}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </Field>

          <Field label="Bio" hint="Short — 1–2 sentences. What you do, who you help.">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Amazon affiliate creating short-form video reviews of viral home & kitchen finds."
              maxLength={240}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <p className="mt-1 text-xs text-slate-400 text-right">
              {bio.length}/240
            </p>
          </Field>

          <Field label="Location">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Los Angeles, CA"
              maxLength={60}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </Field>

          <Field
            label="Amazon Storefront link"
            hint="If set, this replaces the mycard.to URL on your public kit and links straight to your storefront."
          >
            <input
              type="url"
              value={amazonStorefront}
              onChange={(e) => setAmazonStorefront(e.target.value)}
              placeholder="https://www.amazon.com/shop/yourhandle"
              maxLength={200}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </Field>

          <Field
            label="Creator Star Level"
            hint="Your Amazon Creator tier. Leave blank if you'd rather not show it."
          >
            <div className="grid grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setStarLevel("")}
                aria-pressed={starLevel === ""}
                className={`rounded-lg border-2 px-2 py-3 flex flex-col items-center justify-center text-xs font-medium transition ${
                  starLevel === ""
                    ? "border-pink-500 bg-pink-50 text-pink-700"
                    : "border-slate-200 hover:border-slate-300 text-slate-600"
                }`}
              >
                <span className="text-2xl leading-none mb-1">—</span>
                None
              </button>
              {STAR_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setStarLevel(lvl)}
                  aria-pressed={starLevel === lvl}
                  className={`rounded-lg border-2 p-2 flex flex-col items-center justify-center text-xs font-medium transition ${
                    starLevel === lvl
                      ? "border-pink-500 bg-pink-50 text-slate-900"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <StarEmblem level={lvl} size={36} />
                  <span className="mt-1">{LEVEL_LABELS[lvl]}</span>
                </button>
              ))}
            </div>
          </Field>
        </div>
      </div>

      {/* Platforms section — separate "Find me" links rendered as a footer on the public kit. */}
      <div className="mt-8 border-t border-slate-100 pt-6">
        <h3 className="font-semibold text-slate-900">Platforms</h3>
        <p className="text-sm text-slate-600 mt-0.5">
          Where brands can find you. Shown as a row of icons at the bottom of
          your kit, plus used to hyperlink each portfolio section. Add as many
          as you want — multiple per platform is fine (e.g. two YouTube
          channels).
        </p>

        <div className="mt-4 space-y-2">
          {platformLinks.map((link, idx) => {
            const cfg = PLATFORMS[link.platform];
            const isFirst = idx === 0;
            const isLast = idx === platformLinks.length - 1;
            return (
              <div
                key={link.id}
                className="grid grid-cols-[40px_1fr_auto] gap-3 items-center rounded-lg border border-slate-200 p-3"
              >
                <PlatformIcon platform={link.platform} size={36} />
                <div className="space-y-2 min-w-0">
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) =>
                      updatePlatformLink(link.id, { url: e.target.value })
                    }
                    placeholder={`${cfg.label} URL`}
                    maxLength={300}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <input
                    type="text"
                    value={link.label ?? ""}
                    onChange={(e) =>
                      updatePlatformLink(link.id, { label: e.target.value })
                    }
                    placeholder='Optional label (e.g. "Main channel")'
                    maxLength={50}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => movePlatformLink(link.id, "up")}
                    disabled={isFirst}
                    className="p-1 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Move up"
                    title="Move up"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden>
                      <path d="M12 4l-8 8h5v8h6v-8h5z" fill="currentColor" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => movePlatformLink(link.id, "down")}
                    disabled={isLast}
                    className="p-1 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Move down"
                    title="Move down"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden>
                      <path d="M12 20l8-8h-5V4H9v8H4z" fill="currentColor" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removePlatformLink(link.id)}
                    className="text-xs text-slate-400 hover:text-red-600 px-1"
                    aria-label="Remove platform link"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3">
          {showPlatformPicker ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-3">
              <p className="text-xs text-slate-600 mb-2 font-medium">
                Pick a platform
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PLATFORM_ORDER.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => addPlatformLink(p)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left hover:border-pink-300 hover:bg-pink-50 transition"
                  >
                    <PlatformIcon platform={p} size={28} />
                    <span className="text-sm font-medium text-slate-900">
                      {PLATFORMS[p].label}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowPlatformPicker(false)}
                className="mt-3 text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowPlatformPicker(true)}
              className="w-full rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 hover:border-pink-400 hover:text-pink-700 hover:bg-pink-50 transition"
            >
              + Add platform link
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        {saveError && (
          <span className="text-sm text-red-600 mr-auto">{saveError}</span>
        )}
        <button
          type="submit"
          disabled={saving || photoUploading}
          className="rounded-lg bg-pink-600 px-5 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </label>
  );
}
