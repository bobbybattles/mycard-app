"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LINK_TYPE_ORDER,
  getLinkTypeConfig,
  type LinkType,
  type LinksCardData,
  type ProfileLink,
} from "@/lib/links";
import LinkIcon from "./link-icon";

type Props = {
  kitId: string;
  card: { id: string; data: LinksCardData; is_visible: boolean } | null;
  /** Legacy data on the profile card (platform_links + social_profiles) used
   *  to seed the editor the first time a user opens it after upgrade. */
  legacySeed?: ProfileLink[];
};

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function initLinks(
  card: Props["card"],
  legacySeed: ProfileLink[] | undefined
): ProfileLink[] {
  if (card?.data?.links?.length) return card.data.links;
  return legacySeed ?? [];
}

// Editor for the "Connections" card — a single combined list of platforms and
// social profiles. Lives in its own card on the dashboard, below Portfolio.
export default function ConnectionsCardEditor({
  kitId,
  card,
  legacySeed,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [links, setLinks] = useState<ProfileLink[]>(() =>
    initLinks(card, legacySeed)
  );
  const [showPicker, setShowPicker] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const t = setTimeout(() => setSaveStatus("idle"), 2500);
    return () => clearTimeout(t);
  }, [saveStatus]);

  // All options are always available — users often have multiple channels
  // on the same platform (e.g. two YouTube channels) and need to add each.
  const availableTypes = LINK_TYPE_ORDER;

  function addLink(type: LinkType) {
    setLinks((prev) => [...prev, { id: randomId(), type, label: "", url: "" }]);
    setShowPicker(false);
  }

  function updateLink(id: string, patch: Partial<ProfileLink>) {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function removeLink(id: string) {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  function moveLink(id: string, direction: "up" | "down") {
    setLinks((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx === -1) return prev;
      const swap = direction === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaveStatus("idle");

    const cleaned: ProfileLink[] = links
      .map((l) => {
        const url = l.url.trim();
        const withProtocol =
          !url || /^https?:\/\//i.test(url) ? url : `https://${url}`;
        return {
          id: l.id,
          type: l.type,
          label: l.label?.trim() || undefined,
          url: withProtocol,
        };
      })
      .filter((l) => l.url.length > 0)
      .map((l) => ({
        id: l.id,
        type: l.type,
        ...(l.label ? { label: l.label } : {}),
        url: l.url,
      }));

    const data: LinksCardData = { links: cleaned };

    startSave(async () => {
      const { error } = await supabase.from("cards").upsert(
        {
          kit_id: kitId,
          card_type: "links",
          position: 30, // After profile (0), metrics (10), portfolio (20).
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
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <h2 className="font-semibold text-lg text-slate-900">Links</h2>
          <p className="text-sm text-slate-600">
            Every place brands can find you — YouTube, TikTok, Instagram,
            Facebook, Amazon, X, LinkedIn, your website, etc. Shown as a row
            of branded pills at the bottom of your public kit.
          </p>
        </div>
        {saveStatus === "saved" && (
          <span className="text-sm rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1">
            Saved ✓
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {links.map((link, idx) => {
          const cfg = getLinkTypeConfig(link.type);
          const isFirst = idx === 0;
          const isLast = idx === links.length - 1;
          return (
            <div
              key={link.id}
              className="grid grid-cols-[40px_1fr_auto] gap-3 items-center rounded-lg border border-slate-200 p-3"
            >
              <LinkIcon type={link.type} size={36} />
              <div className="space-y-2 min-w-0">
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => updateLink(link.id, { url: e.target.value })}
                  placeholder={cfg.urlHint}
                  maxLength={300}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <input
                  type="text"
                  value={link.label ?? ""}
                  onChange={(e) =>
                    updateLink(link.id, { label: e.target.value })
                  }
                  placeholder='Optional label (e.g. "Main channel" or "Personal blog")'
                  maxLength={50}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveLink(link.id, "up")}
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
                  onClick={() => moveLink(link.id, "down")}
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
                  onClick={() => removeLink(link.id)}
                  className="text-xs text-slate-400 hover:text-red-600 px-1"
                  aria-label="Remove"
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
        {showPicker ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-3">
            <p className="text-xs text-slate-600 mb-2 font-medium">Pick one</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableTypes.map((t) => {
                const cfg = getLinkTypeConfig(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => addLink(t)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left hover:border-pink-300 hover:bg-pink-50 transition"
                  >
                    <LinkIcon type={t} size={28} />
                    <span className="text-sm font-medium text-slate-900">
                      {cfg.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="mt-3 text-xs text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="w-full rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 hover:border-pink-400 hover:text-pink-700 hover:bg-pink-50 transition"
          >
            + Add a link
          </button>
        )}
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        {saveError && (
          <span className="text-sm text-red-600 mr-auto">{saveError}</span>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-pink-600 px-5 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {saving ? "Saving…" : "Save links"}
        </button>
      </div>
    </form>
  );
}
