"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  detectVideoSource,
  extractTikTokId,
  extractYouTubeId,
  fetchVideoMeta,
  getTikTokEmbedUrl,
  getYouTubeEmbedUrl,
  getYouTubeThumbnail,
} from "@/lib/video-utils";
import { detectPlatform } from "@/lib/platforms";

type Props = {
  url: string;
  title: string;
  thumbnailUrl?: string;
  hlsUrl?: string;
};

/** Vertical platforms get a 9:16 tile; everything else stays 16:9. */
function aspectClassFor(platform: ReturnType<typeof detectPlatform>) {
  if (platform === "tiktok" || platform === "instagram") return "aspect-[9/16]";
  return "aspect-video";
}

// Click-to-play tile.
// Initial state: just a thumbnail + play overlay (no iframe/video network cost).
// On click:
//   YouTube → swap in an autoplay iframe.
//   TikTok → swap in the TikTok embed/v2 iframe.
//   Amazon Live (or anything with hls_url) → swap in an HTML5 <video> playing
//     the m3u8 stream via hls.js (lazy-loaded; Safari plays HLS natively).
//   Anything else → fall back to opening the URL in a new tab.
export default function VideoPlayer({ url, title, thumbnailUrl, hlsUrl }: Props) {
  const source = detectVideoSource(url);
  const platform = detectPlatform(url);
  const ytId = source === "youtube" ? extractYouTubeId(url) : null;
  const tiktokId = source === "tiktok" ? extractTikTokId(url) : null;
  const builtInThumb = ytId ? getYouTubeThumbnail(ytId) : null;

  // Lazy-fetch a TikTok thumbnail if the kit was saved before TikTok support
  // shipped (so thumbnail_url is empty). Same effect for Amazon.
  const [resolvedThumb, setResolvedThumb] = useState<string | null>(
    thumbnailUrl || builtInThumb || null
  );
  useEffect(() => {
    if (resolvedThumb) return;
    if (source !== "tiktok" && source !== "amazon") return;
    let cancelled = false;
    (async () => {
      const meta = await fetchVideoMeta(url);
      if (cancelled) return;
      if (meta.thumbnail) setResolvedThumb(meta.thumbnail);
    })();
    return () => {
      cancelled = true;
    };
  }, [resolvedThumb, source, url]);

  const canPlayInline = !!(ytId || tiktokId || hlsUrl);
  const [playing, setPlaying] = useState(false);

  function handleClick(e: React.MouseEvent) {
    if (canPlayInline) {
      e.preventDefault();
      setPlaying(true);
    }
  }

  const aspect = aspectClassFor(platform);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="group block rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-pink-200 transition"
    >
      <div className={`relative ${aspect} bg-slate-100`}>
        {playing && ytId && (
          <iframe
            src={getYouTubeEmbedUrl(ytId, { autoplay: true })}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        )}
        {playing && tiktokId && !ytId && (
          <iframe
            src={getTikTokEmbedUrl(tiktokId)}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            scrolling="no"
            className="absolute inset-0 w-full h-full"
          />
        )}
        {playing && !ytId && !tiktokId && hlsUrl && (
          <HlsPlayer src={hlsUrl} poster={resolvedThumb ?? undefined} title={title} />
        )}
        {!playing && (
          <>
            {resolvedThumb ? (
              <Image
                src={resolvedThumb}
                alt={title}
                fill
                sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-semibold">
                {source === "amazon"
                  ? "Amazon"
                  : source === "tiktok"
                    ? "TikTok"
                    : "Video"}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-12 w-12 rounded-full bg-black/55 group-hover:bg-pink-600 transition flex items-center justify-center shadow">
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden className="text-white">
                  <path fill="currentColor" d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            {source === "amazon" && (
              <span className="absolute top-2 left-2 rounded bg-black/60 text-white text-[10px] font-semibold uppercase px-1.5 py-0.5">
                Amazon
              </span>
            )}
            {source === "tiktok" && (
              <span className="absolute top-2 left-2 rounded bg-black/60 text-white text-[10px] font-semibold uppercase px-1.5 py-0.5">
                TikTok
              </span>
            )}
          </>
        )}
      </div>
      <div className="px-4 py-3">
        <p className="text-sm font-semibold text-slate-900 line-clamp-2">
          {title}
        </p>
      </div>
    </a>
  );
}

// HLS .m3u8 player that loads hls.js on demand. Safari plays HLS natively.
function HlsPlayer({
  src,
  poster,
  title,
}: {
  src: string;
  poster?: string;
  title: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      void video.play().catch(() => {});
      return;
    }
    let hlsInstance: { destroy: () => void } | null = null;
    let cancelled = false;
    (async () => {
      try {
        const mod = await import("hls.js");
        if (cancelled) return;
        const Hls = mod.default;
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true });
          hls.loadSource(src);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            void video.play().catch(() => {});
          });
          hlsInstance = hls;
        } else {
          video.src = src;
          void video.play().catch(() => {});
        }
      } catch (err) {
        console.warn("hls.js load failed", err);
      }
    })();
    return () => {
      cancelled = true;
      hlsInstance?.destroy();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      poster={poster}
      controls
      playsInline
      title={title}
      className="absolute inset-0 w-full h-full bg-black"
    />
  );
}
