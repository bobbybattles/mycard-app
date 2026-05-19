import { PLATFORMS } from "@/lib/platforms";
import PlatformIcon from "./platform-icon";
import VideoPlayer from "./video-player";
import type {
  PortfolioCardData,
  PortfolioGroup,
  PortfolioVideo,
} from "./portfolio-card-editor";
import { detectPlatform } from "@/lib/platforms";

type Props = {
  data: PortfolioCardData;
};

/** Normalize old { videos: [...] } shape into grouped form for rendering. */
function normalizeGroups(data: PortfolioCardData): PortfolioGroup[] {
  if (Array.isArray(data.groups) && data.groups.length > 0) return data.groups;
  const oldVideos = (data as { videos?: PortfolioVideo[] }).videos ?? [];
  if (oldVideos.length === 0) return [];
  const byPlatform = new Map<string, PortfolioVideo[]>();
  for (const v of oldVideos) {
    const p = detectPlatform(v.url) ?? "youtube";
    if (!byPlatform.has(p)) byPlatform.set(p, []);
    byPlatform.get(p)!.push(v);
  }
  return Array.from(byPlatform.entries()).map(([platform, videos], i) => ({
    id: `legacy-${i}`,
    platform: platform as PortfolioGroup["platform"],
    videos,
  }));
}

export default function PortfolioCard({ data }: Props) {
  const groups = normalizeGroups(data).filter((g) => g.videos.length > 0);
  if (groups.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
        Portfolio
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-8">
        {groups.map((group) => {
          const cfg = PLATFORMS[group.platform];
          return (
            <div key={group.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <div className="flex items-center gap-2.5 mb-3">
                <PlatformIcon platform={group.platform} size={28} />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">
                    {cfg.label}
                  </h3>
                  {group.label && (
                    <p className="text-xs text-slate-600 leading-tight truncate">
                      {group.label}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {group.videos.map((video, i) => {
                  const title = video.title?.trim() || cfg.label + " video";
                  return (
                    <VideoPlayer
                      key={i}
                      url={video.url}
                      title={title}
                      thumbnailUrl={video.thumbnail_url}
                      hlsUrl={video.hls_url}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
