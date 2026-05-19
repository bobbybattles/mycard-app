"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RESERVED_SLUGS, SLUG_RE } from "@/lib/kits";

type Props = {
  kitId: string;
  initialName: string;
  initialSlug: string;
};

// Inline editor for a kit's name + URL slug.
// Both update the same row in the kits table.
export default function KitSettingsEditor({
  kitId,
  initialName,
  initialSlug,
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const t = setTimeout(() => setSaveStatus("idle"), 2500);
    return () => clearTimeout(t);
  }, [saveStatus]);

  // Live validation for the slug field — same rules as the DB CHECK.
  useEffect(() => {
    const trimmed = slug.trim().toLowerCase();
    if (!trimmed) {
      setSlugError(null);
      return;
    }
    if (!SLUG_RE.test(trimmed)) {
      setSlugError("3–30 chars, lowercase letters, numbers, _ or -");
      return;
    }
    if (RESERVED_SLUGS.has(trimmed)) {
      setSlugError("That slug is reserved. Pick another.");
      return;
    }
    setSlugError(null);
  }, [slug]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (slugError) return;
    setSaveError(null);
    setSaveStatus("idle");

    const cleanedName = name.trim();
    const cleanedSlug = slug.trim().toLowerCase();

    startSave(async () => {
      const { error } = await supabase
        .from("kits")
        .update({
          name: cleanedName || null,
          slug: cleanedSlug || null,
        })
        .eq("id", kitId);
      if (error) {
        setSaveStatus("error");
        setSaveError(
          error.code === "23505"
            ? "That URL slug is already taken. Pick another."
            : error.message
        );
        return;
      }
      setSaveStatus("saved");
      // Refresh server data so the header shows the new name/slug.
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-semibold text-lg text-slate-900">Kit settings</h2>
          <p className="text-sm text-slate-600">
            Name (your label for this kit) and URL slug (the public address).
          </p>
        </div>
        {saveStatus === "saved" && (
          <span className="text-sm rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1">
            Saved ✓
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1">
            Kit name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g. "Tech brand kit"'
            maxLength={80}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1">
            URL slug
          </span>
          <div className="flex items-stretch rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-pink-500 overflow-hidden">
            <span className="px-3 inline-flex items-center bg-slate-50 text-slate-500 text-sm font-mono border-r border-slate-300">
              mycard.to/
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="yourslug"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={30}
              className="flex-1 min-w-0 px-3 py-2 text-sm text-slate-900 focus:outline-none font-mono"
            />
          </div>
          {slugError && (
            <p className="mt-1 text-xs text-red-600">{slugError}</p>
          )}
        </label>
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        {saveError && (
          <span className="text-sm text-red-600 mr-auto">{saveError}</span>
        )}
        <button
          type="submit"
          disabled={saving || !!slugError}
          className="rounded-lg bg-pink-600 px-5 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
