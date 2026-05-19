"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  detectVideoSource,
  extractYouTubeId,
  fetchVideoMeta,
  getYouTubeThumbnail,
} from "@/lib/video-utils";

export type PortfolioVideo = {
  url: string;
  title?: string;
  /** Cached thumbnail URL (Amazon scrape result or any external poster). */
  thumbnail_url?: string;
  /** Cached HLS stream URL for sources that expose one (Amazon VDP). */
  hls_url?: string;
};

export type PortfolioCardData = {
  videos: PortfolioVideo[];
};

type Props = {
  kitId: string;
  card: { id: string; data: PortfolioCardData; is_visible: boolean } | null;
};

const MAX_SLOTS = 6;

// Pad / truncate the user's saved videos to exactly MAX_SLOTS so the form
// always renders the same number of rows.
function initSlots(data: PortfolioCardData | undefined): PortfolioVideo[] {
  const saved = data?.videos ?? [];
  const slots: PortfolioVideo[] = [];
  for (let i = 0; i < MAX_SLOTS; i++) {
    slots.push(saved[i] ?? { url: "", title: "" });
  }
  return slots;
}

export default function PortfolioCardEditor({ kitId, card }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [slots, setSlots] = useState<PortfolioVideo[]>(() =>
    initSlots(card?.data)
  );
  // Track which slots are currently fetching their title from oEmbed.
  const [fetching, setFetching] = useState<Record<number, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const t = setTimeout(() => setSaveStatus("idle"), 2500);
    return () => clearTimeout(t);
  }, [saveStatus]);

  function setSlot(i: number, patch: Partial<PortfolioVideo>) {
    setSlots((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }

  // When the URL in a slot changes, try to auto-fill the title + thumbnail.
  // YouTube uses oEmbed (client-side). Amazon hits our /api/video-meta scraper.
  function handleUrlChange(i: number, value: string) {
    setSlot(i, { url: value });
    const source = detectVideoSource(value);
    if (source !== "youtube" && source !== "amazon") return;
    setFetching((f) => ({ ...f, [i]: true }));
    // Tiny debounce so we don't fire on every keystroke.
    const cancel = setTimeout(async () => {
      const meta = await fetchVideoMeta(value);
      setFetching((f) => ({ ...f, [i]: false }));
      setSlots((prev) => {
        const next = [...prev];
        const current = next[i];
        // Only fill the title if the user hasn't typed their own.
        const titleToUse = current.title?.trim() || meta.title || current.title;
        next[i] = {
          ...current,
          title: titleToUse,
          // Always update cached thumbnail + hls when we have fresh values.
          thumbnail_url: meta.thumbnail ?? current.thumbnail_url,
          hls_url: meta.hls ?? current.hls_url,
        };
        return next;
      });
    }, 450);
    return () => clearTimeout(cancel);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaveStatus("idle");

    // Persist only slots with a non-empty URL. Trim everything.
    const videos: PortfolioVideo[] = slots
      .map((s) => ({
        url: s.url.trim(),
        title: s.title?.trim() || "",
        thumbnail_url: s.thumbnail_url,
        hls_url: s.hls_url,
      }))
      .filter((s) => s.url.length > 0)
      .map((s) => ({
        url: s.url,
        ...(s.title ? { title: s.title } : {}),
        ...(s.thumbnail_url ? { thumbnail_url: s.thumbnail_url } : {}),
        ...(s.hls_url ? { hls_url: s.hls_url } : {}),
      }));

    const data: PortfolioCardData = { videos };

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
        const { error } = await supabase.from("cards").insert({
          kit_id: kitId,
          card_type: "portfolio",
          position: 20, // After profile (0) and metrics (10).
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

  const filledCount = slots.filter((s) => s.url.trim()).length;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <h2 className="font-semibold text-lg text-slate-900">Portfolio</h2>
          <p className="text-sm text-slate-600">
            Up to 6 videos from YouTube or your Amazon Storefront. Shown in a
            3×2 grid on your public kit.
          </p>
        </div>
        {saveStatus === "saved" && (
          <span className="text-sm rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1">
            Saved ✓
          </span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {slots.map((slot, i) => {
          const source = detectVideoSource(slot.url);
          const ytId = source === "youtube" ? extractYouTubeId(slot.url) : null;
          const previewThumb =
            (ytId && getYouTubeThumbnail(ytId)) || slot.thumbnail_url || null;
          const isFetching = !!fetching[i];
          return (
            <div
              key={i}
              className="grid grid-cols-[80px_1fr] gap-3 items-start rounded-lg border border-slate-200 p-3"
            >
              {/* Thumbnail preview (or placeholder) */}
              <div className="aspect-video bg-slate-100 rounded overflow-hidden flex items-center justify-center text-slate-400 text-xs">
                {previewThumb ? (
                  // Plain <img> — no Next/Image inside an editor preview.
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={previewThumb}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : source === "amazon" ? (
                  <span className="text-[10px] font-semibold text-slate-500">
                    AMAZON
                  </span>
                ) : (
                  <span aria-hidden>{i + 1}</span>
                )}
              </div>

              <div className="space-y-2">
                <div>
                  <input
                    type="url"
                    value={slot.url}
                    onChange={(e) => handleUrlChange(i, e.target.value)}
                    placeholder={`Video ${i + 1} URL — YouTube or Amazon Storefront`}
                    maxLength={400}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={slot.title ?? ""}
                    onChange={(e) => setSlot(i, { title: e.target.value })}
                    placeholder={
                      isFetching
                        ? "Fetching title from YouTube…"
                        : "Title (auto-filled for YouTube)"
                    }
                    maxLength={200}
                    disabled={isFetching}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="text-xs text-slate-500">
          {filledCount} of {MAX_SLOTS} slots filled
        </span>
        <div className="flex items-center gap-3">
          {saveError && (
            <span className="text-sm text-red-600">{saveError}</span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-pink-600 px-5 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? "Saving…" : "Save portfolio"}
          </button>
        </div>
      </div>
    </form>
  );
}
