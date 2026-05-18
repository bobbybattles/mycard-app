"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import StarEmblem, { type StarLevel, LEVEL_LABELS } from "./star-emblem";

// Shape stored in cards.data for card_type = "profile".
export type ProfileCardData = {
  photo_url?: string;
  name?: string;
  bio?: string;
  niche?: string;
  location?: string;
  star_level?: StarLevel;
};

const STAR_LEVELS: StarLevel[] = ["bronze", "silver", "gold", "platinum"];

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
  const [starLevel, setStarLevel] = useState<StarLevel | "">(
    card?.data.star_level ?? ""
  );
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

    const data: ProfileCardData = {
      // Preserve any existing niche on the card so a future "Niche" field can re-read it.
      ...(card?.data.niche ? { niche: card.data.niche } : {}),
      photo_url: photoUrl || undefined,
      name: name.trim() || undefined,
      bio: bio.trim() || undefined,
      location: location.trim() || undefined,
      star_level: starLevel || undefined,
    };

    startSave(async () => {
      if (card) {
        const { error } = await supabase
          .from("cards")
          .update({ data, is_visible: true })
          .eq("id", card.id);
        if (error) {
          setSaveStatus("error");
          setSaveError(error.message);
          return;
        }
      } else {
        const { error } = await supabase
          .from("cards")
          .insert({
            kit_id: kitId,
            card_type: "profile",
            position: 0,
            is_visible: true,
            data,
          });
        if (error) {
          setSaveStatus("error");
          setSaveError(error.message);
          return;
        }
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
