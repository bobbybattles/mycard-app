import Image from "next/image";
import {
  detectVideoSource,
  extractYouTubeId,
  getYouTubeThumbnail,
} from "@/lib/video-utils";
import type { PortfolioCardData } from "./portfolio-card-editor";

type Props = {
  data: PortfolioCardData;
};

// Public render of the Portfolio card.
// Renders up to 6 videos in a 3×2 grid. Each tile has a 16:9 thumbnail with a
// play-icon overlay, the title below, and the whole tile is a clickable link
// that opens the source in a new tab.
export default function PortfolioCard({ data }: Props) {
  const videos = (data.videos ?? []).filter((v) => v.url?.trim());
  if (videos.length === 0) return null;

  return (
    <section>
      <header className="text-center mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-pink-600">
          Portfolio
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {videos.map((video, i) => {
          const source = detectVideoSource(video.url);
          const ytId = source === "youtube" ? extractYouTubeId(video.url) : null;
          const thumb = ytId ? getYouTubeThumbnail(ytId) : null;
          const fallbackLabel =
            source === "amazon" ? "Amazon" : `Video ${i + 1}`;
          const titleText =
            video.title?.trim() ||
            (source === "amazon" ? "Amazon Storefront video" : "Untitled video");

          return (
            <a
              key={i}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-pink-200 transition"
            >
              <div className="relative aspect-video bg-slate-100">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt={titleText}
                    fill
                    sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-semibold">
                    {fallbackLabel}
                  </div>
                )}
                {/* Play-icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="h-12 w-12 rounded-full bg-black/55 group-hover:bg-pink-600 transition flex items-center justify-center shadow">
                    <svg
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      aria-hidden
                      className="text-white"
                    >
                      <path fill="currentColor" d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                {source === "amazon" && (
                  <span className="absolute top-2 left-2 rounded bg-black/60 text-white text-[10px] font-semibold uppercase px-1.5 py-0.5">
                    Amazon
                  </span>
                )}
              </div>
              <div className="px-4 py-3">
                <p className="text-sm font-semibold text-slate-900 line-clamp-2">
                  {titleText}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
