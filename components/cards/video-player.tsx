"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  detectVideoSource,
  extractYouTubeId,
  getYouTubeEmbedUrl,
  getYouTubeThumbnail,
} from "@/lib/video-utils";

type Props = {
  url: string;
  title: string;
  thumbnailUrl?: string;
  hlsUrl?: string;
};

// Click-to-play tile.
// Initial state: just a thumbnail + play overlay (no iframe/video network cost).
// On click:
//   YouTube → swap in an autoplay iframe.
//   Amazon (or other) with hls_url → swap in an HTML5 <video> that plays the
//     m3u8 stream via hls.js (loaded on demand; Safari plays HLS natively).
//   Anything else → fall back to opening the URL in a new tab.
export default function VideoPlayer({ url, title, thumbnailUrl, hlsUrl }: Props) {
  const source = detectVideoSource(url);
  const ytId = source === "youtube" ? extractYouTubeId(url) : null;
  const thumbnail = thumbnailUrl || (ytId ? getYouTubeThumbnail(ytId) : null);

  // canPlayInline = we know how to render an inline player for this URL.
  const canPlayInline = !!(ytId || hlsUrl);
  const [playing, setPlaying] = useState(false);

  function handleClick(e: React.MouseEvent) {
    if (canPlayInline) {
      e.preventDefault();
      setPlaying(true);
    }
    // Otherwise fall through to the <a> default — opens in new tab.
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="group block rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-pink-200 transition"
    >
      <div className="relative aspect-video bg-slate-100">
        {playing && ytId && (
          <iframe
            src={getYouTubeEmbedUrl(ytId, { autoplay: true })}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        )}
        {playing && !ytId && hlsUrl && (
          <HlsPlayer src={hlsUrl} poster={thumbnail ?? undefined} title={title} />
        )}
        {!playing && (
          <>
            {thumbnail ? (
              <Image
                src={thumbnail}
                alt={title}
                fill
                sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-semibold">
                {source === "amazon" ? "Amazon" : "Video"}
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

    // Safari + iOS: native HLS support, just set the src and go.
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      void video.play().catch(() => {});
      return;
    }

    // Chrome / Firefox / Edge: lazy-load hls.js (~100KB) only on click.
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
          // Last-ditch fallback — set src directly. Some browsers will surprise us.
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
