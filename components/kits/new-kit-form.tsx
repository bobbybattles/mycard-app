"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RESERVED_SLUGS, SLUG_RE } from "@/lib/kits";

type Props = {
  /** The user's existing kits, used to power the "Copy of …" dropdown. */
  existingKits: { id: string; label: string }[];
};

// Client form to create a new kit. Two modes:
//   "blank"     → just inserts a new kits row.
//   "duplicate" → inserts a new kits row, then copies every card from
//                 the chosen source kit into the new kit.
export default function NewKitForm({ existingKits }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [mode, setMode] = useState<"blank" | "duplicate">("blank");
  const [sourceId, setSourceId] = useState<string>(
    existingKits[0]?.id ?? ""
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

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
    setSubmitError(null);
    if (slugError) return;

    const cleanedName = name.trim();
    const cleanedSlug = slug.trim().toLowerCase();

    startSubmit(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSubmitError("You're not signed in. Try signing in again.");
        return;
      }

      // 1) Create the new kit row.
      const { data: created, error: createErr } = await supabase
        .from("kits")
        .insert({
          user_id: user.id,
          name: cleanedName || null,
          slug: cleanedSlug || null,
          is_published: true,
        })
        .select("id")
        .single();

      if (createErr || !created) {
        setSubmitError(
          createErr?.code === "23505"
            ? "That URL slug is already taken. Pick another."
            : (createErr?.message ?? "Couldn't create the kit.")
        );
        return;
      }

      // 2) If duplicating, copy every card from the source kit into the new one.
      if (mode === "duplicate" && sourceId) {
        const { data: sourceCards, error: cardsErr } = await supabase
          .from("cards")
          .select("card_type, position, is_visible, data")
          .eq("kit_id", sourceId);
        if (cardsErr) {
          setSubmitError(
            `Kit was created, but I couldn't copy cards: ${cardsErr.message}`
          );
          // Still navigate so user can fill in by hand.
          router.push(`/app/kits/${created.id}`);
          return;
        }
        if (sourceCards && sourceCards.length > 0) {
          const rows = sourceCards.map((c) => ({
            kit_id: created.id,
            card_type: c.card_type,
            position: c.position,
            is_visible: c.is_visible,
            data: c.data,
          }));
          const { error: copyErr } = await supabase.from("cards").insert(rows);
          if (copyErr) {
            setSubmitError(
              `Kit was created, but card copy failed: ${copyErr.message}`
            );
            router.push(`/app/kits/${created.id}`);
            return;
          }
        }
      }

      router.push(`/app/kits/${created.id}`);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
    >
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
          required
          autoFocus
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        <p className="mt-1 text-xs text-slate-500">
          Just for you — used in your kit list to identify this one.
        </p>
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
            required
            className="flex-1 min-w-0 px-3 py-2 text-sm text-slate-900 focus:outline-none font-mono"
          />
        </div>
        {slugError && (
          <p className="mt-1 text-xs text-red-600">{slugError}</p>
        )}
        <p className="mt-1 text-xs text-slate-500">
          Public URL for this kit. Each kit needs a unique one.
        </p>
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-700">
          Start from
        </legend>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="mode"
            value="blank"
            checked={mode === "blank"}
            onChange={() => setMode("blank")}
          />
          <span className="text-sm text-slate-900">Blank kit</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="mode"
            value="duplicate"
            checked={mode === "duplicate"}
            onChange={() => setMode("duplicate")}
            disabled={existingKits.length === 0}
          />
          <span
            className={`text-sm ${
              existingKits.length === 0 ? "text-slate-400" : "text-slate-900"
            }`}
          >
            Copy of an existing kit
          </span>
        </label>
        {mode === "duplicate" && (
          <select
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            {existingKits.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        )}
      </fieldset>

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        {submitError && (
          <span className="text-sm text-red-600 mr-auto">{submitError}</span>
        )}
        <button
          type="submit"
          disabled={submitting || !!slugError}
          className="rounded-lg bg-pink-600 px-5 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {submitting ? "Creating…" : "Create kit"}
        </button>
      </div>
    </form>
  );
}
