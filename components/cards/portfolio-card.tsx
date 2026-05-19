import { detectVideoSource } from "@/lib/video-utils";
import VideoPlayer from "./video-player";
import type { PortfolioCardData } from "./portfolio-card-editor";

type Props = {
  data: PortfolioCardData;
};

// Public render of the Portfolio card.
// Renders up to 6 videos in a 3-column grid. Each tile is a VideoPlayer that
// click-to-plays inline when the source is embeddable (YouTube iframe, Amazon
// HLS) and falls back to opening in a new tab otherwise.
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
          const fallbackTitle =
            source === "amazon" ? "Amazon Storefront video" : "Untitled video";
          const titleText = video.title?.trim() || fallbackTitle;
          return (
            <VideoPlayer
              key={i}
              url={video.url}
              title={titleText}
              thumbnailUrl={video.thumbnail_url}
              hlsUrl={video.hls_url}
            />
          );
        })}
      </div>
    </section>
  );
}
