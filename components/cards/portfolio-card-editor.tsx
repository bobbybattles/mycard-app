"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  detectVideoSource,
  extractYouTubeId,
  fetchVideoMeta,
  getYouTubeThumbnail,
} from "@/lib/video-utils";
import {
  PLATFORMS,
  PLATFORM_ORDER,
  detectPlatform,
  type Platform,
} from "@/lib/platforms";
import PlatformIcon from "./platform-icon";

export type PortfolioVideo = {
  url: string;
  title?: string;
  thumbnail_url?: string;
  hls_url?: string;
};

export type PortfolioGroup = {
  /** Local-only id for React keys and reordering. Persisted so groups keep identity. */
  id: string;
  platform: Platform;
  /** Optional label like "Main channel" or "Cooking channel". */
  label?: string;
  /** Up to 3 videos per group. */
  videos: PortfolioVideo[];
};

export type PortfolioCardData = {
  groups: PortfolioGroup[];
  /** Legacy v1 field — kept readable so we can migrate. */
  videos?: PortfolioVideo[];
};

type Props = {
  kitId: string;
  card: { id: string; data: PortfolioCardData; is_visible: boolean } | null;
};

const MAX_VIDEOS_PER_GROUP = 3;

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

/** Migrate old { videos: [...] } shape into platform-detected groups. */
function migrateOldData(raw: PortfolioCardData | undefined): PortfolioGroup[] {
  if (!raw) return [];
  if (Array.isArray(raw.groups) && raw.groups.length > 0) return raw.groups;
  const oldVideos = raw.videos ?? [];
  if (oldVideos.length === 0) return [];
  // Bucket each old video by its detected platform.
  const byPlatform = new Map<Platform, PortfolioVideo[]>();
  for (const v of oldVideos) {
    const p = detectPlatform(v.url) ?? "youtube";
    if (!byPlatform.has(p)) byPlatform.set(p, []);
    byPlatform.get(p)!.push(v);
  }
  return Array.from(byPlatform.entries()).map(([platform, videos]) => ({
    id: randomId(),
    platform,
    videos: videos.slice(0, MAX_VIDEOS_PER_GROUP),
  }));
}

export default function PortfolioCardEditor({ kitId, card }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [groups, setGroups] = useState<PortfolioGroup[]>(() =>
    migrateOldData(card?.data)
  );
  const [showPlatformPicker, setShowPlatformPicker] = useState(false);
  const [fetching, setFetching] = useState<Record<string, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const t = setTimeout(() => setSaveStatus("idle"), 2500);
    return () => clearTimeout(t);
  }, [saveStatus]);

  function addGroup(platform: Platform) {
    setGroups((prev) => [
      ...prev,
      { id: randomId(), platform, videos: [{ url: "", title: "" }] },
    ]);
    setShowPlatformPicker(false);
  }

  function removeGroup(groupId: string) {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }

  function moveGroup(groupId: string, direction: "up" | "down") {
    setGroups((prev) => {
      const idx = prev.findIndex((g) => g.id === groupId);
      if (idx === -1) return prev;
      const swap = direction === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }

  function updateGroupLabel(groupId: string, label: string) {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, label } : g))
    );
  }

  function addVideoSlot(groupId: string) {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId && g.videos.length < MAX_VIDEOS_PER_GROUP
          ? { ...g, videos: [...g.videos, { url: "", title: "" }] }
          : g
      )
    );
  }

  function removeVideoSlot(groupId: string, idx: number) {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, videos: g.videos.filter((_, i) => i !== idx) }
          : g
      )
    );
  }

  function setVideo(groupId: string, idx: number, patch: Partial<PortfolioVideo>) {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              videos: g.videos.map((v, i) =>
                i === idx ? { ...v, ...patch } : v
              ),
            }
          : g
      )
    );
  }

  // Auto-fill title + thumbnail when a URL is pasted.
  function handleUrlChange(groupId: string, idx: number, value: string) {
    setVideo(groupId, idx, { url: value });
    const source = detectVideoSource(value);
    if (source !== "youtube" && source !== "amazon") return;
    const fetchKey = `${groupId}:${idx}`;
    setFetching((f) => ({ ...f, [fetchKey]: true }));
    const cancel = setTimeout(async () => {
      const meta = await fetchVideoMeta(value);
      setFetching((f) => ({ ...f, [fetchKey]: false }));
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id !== groupId) return g;
          return {
            ...g,
            videos: g.videos.map((v, i) => {
              if (i !== idx) return v;
              return {
                ...v,
                title: v.title?.trim() || meta.title || v.title,
                thumbnail_url: meta.thumbnail ?? v.thumbnail_url,
                hls_url: meta.hls ?? v.hls_url,
              };
            }),
          };
        })
      );
    }, 450);
    return () => clearTimeout(cancel);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaveStatus("idle");

    // Strip empty videos and empty groups.
    const cleaned: PortfolioGroup[] = groups
      .map((g) => ({
        id: g.id,
        platform: g.platform,
        label: g.label?.trim() || undefined,
        videos: g.videos
          .map((v) => ({
            url: v.url.trim(),
            title: v.title?.trim() || undefined,
            thumbnail_url: v.thumbnail_url,
            hls_url: v.hls_url,
          }))
          .filter((v) => v.url.length > 0)
          .map((v) => ({
            url: v.url,
            ...(v.title ? { title: v.title } : {}),
            ...(v.thumbnail_url ? { thumbnail_url: v.thumbnail_url } : {}),
            ...(v.hls_url ? { hls_url: v.hls_url } : {}),
          })),
      }))
      .filter((g) => g.videos.length > 0)
      .map((g) => ({
        id: g.id,
        platform: g.platform,
        ...(g.label ? { label: g.label } : {}),
        videos: g.videos,
      }));

    const data: PortfolioCardData = { groups: cleaned };

    startSave(async () => {
      const { error } = await supabase.from("cards").upsert(
        {
          kit_id: kitId,
          card_type: "portfolio",
          position: 20,
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
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-semibold text-lg text-slate-900">Portfolio</h2>
          <p className="text-sm text-slate-600">
            Group videos by where they live. Up to 3 videos per group. Add a
            group for each platform — or multiple groups if you have more than
            one channel on the same platform.
          </p>
        </div>
        {saveStatus === "saved" && (
          <span className="text-sm rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1">
            Saved ✓
          </span>
        )}
      </div>

      <div className="space-y-4">
        {groups.map((group, groupIdx) => {
          const cfg = PLATFORMS[group.platform];
          const isFirst = groupIdx === 0;
          const isLast = groupIdx === groups.length - 1;
          return (
            <div
              key={group.id}
              className="rounded-lg border border-slate-200 bg-slate-50/60 p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <PlatformIcon platform={group.platform} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {cfg.label}
                  </p>
                  <input
                    type="text"
                    value={group.label ?? ""}
                    onChange={(e) => updateGroupLabel(group.id, e.target.value)}
                    placeholder='Optional label (e.g. "Main channel")'
                    maxLength={50}
                    className="mt-1 w-full text-xs text-slate-700 bg-transparent border-0 px-0 focus:outline-none focus:ring-0 placeholder:text-slate-400"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveGroup(group.id, "up")}
                    disabled={isFirst}
                    className="p-1.5 rounded text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Move group up"
                    title="Move up"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                      <path d="M12 4l-8 8h5v8h6v-8h5z" fill="currentColor" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveGroup(group.id, "down")}
                    disabled={isLast}
                    className="p-1.5 rounded text-slate-500 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Move group down"
                    title="Move down"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                      <path d="M12 20l8-8h-5V4H9v8H4z" fill="currentColor" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeGroup(group.id)}
                    className="text-xs text-slate-500 hover:text-red-600 transition px-2 py-1"
                    aria-label="Remove group"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {group.videos.map((video, idx) => {
                  const source = detectVideoSource(video.url);
                  const ytId =
                    source === "youtube" ? extractYouTubeId(video.url) : null;
                  const previewThumb =
                    (ytId && getYouTubeThumbnail(ytId)) ||
                    video.thumbnail_url ||
                    null;
                  const fetchKey = `${group.id}:${idx}`;
                  const isFetching = !!fetching[fetchKey];
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-[60px_1fr_auto] gap-3 items-start rounded bg-white border border-slate-200 p-3"
                    >
                      <div className="aspect-video bg-slate-100 rounded overflow-hidden flex items-center justify-center text-slate-400 text-xs">
                        {previewThumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewThumb}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span aria-hidden>{idx + 1}</span>
                        )}
                      </div>
                      <div className="space-y-2 min-w-0">
                        <input
                          type="url"
                          value={video.url}
                          onChange={(e) =>
                            handleUrlChange(group.id, idx, e.target.value)
                          }
                          placeholder={cfg.urlHint}
                          maxLength={400}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                        <input
                          type="text"
                          value={video.title ?? ""}
                          onChange={(e) =>
                            setVideo(group.id, idx, { title: e.target.value })
                          }
                          placeholder={
                            isFetching ? "Fetching title…" : "Title"
                          }
                          disabled={isFetching}
                          maxLength={200}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-slate-50"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVideoSlot(group.id, idx)}
                        className="text-xs text-slate-400 hover:text-red-600 px-2 py-1 self-start"
                        aria-label="Remove video"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
                {group.videos.length < MAX_VIDEOS_PER_GROUP && (
                  <button
                    type="button"
                    onClick={() => addVideoSlot(group.id)}
                    className="text-xs text-pink-600 font-semibold hover:text-pink-700 px-1 py-2"
                  >
                    + Add another video ({group.videos.length}/{MAX_VIDEOS_PER_GROUP})
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add a new group */}
      <div className="mt-4">
        {(() => {
          const usedPlatforms = new Set(groups.map((g) => g.platform));
          const availablePlatforms = PLATFORM_ORDER.filter(
            (p) => !usedPlatforms.has(p)
          );
          if (availablePlatforms.length === 0) {
            return (
              <p className="text-xs text-slate-500 italic px-1">
                All platforms have a group. Remove one above to add a different
                platform.
              </p>
            );
          }
          if (showPlatformPicker) {
            return (
              <div className="rounded-lg border border-dashed border-slate-300 p-3">
                <p className="text-xs text-slate-600 mb-2 font-medium">
                  Pick a platform
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availablePlatforms.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => addGroup(p)}
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
            );
          }
          return (
            <button
              type="button"
              onClick={() => setShowPlatformPicker(true)}
              className="w-full rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 hover:border-pink-400 hover:text-pink-700 hover:bg-pink-50 transition"
            >
              + Add a video group
            </button>
          );
        })()}
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
          {saving ? "Saving…" : "Save portfolio"}
        </button>
      </div>
    </form>
  );
}
