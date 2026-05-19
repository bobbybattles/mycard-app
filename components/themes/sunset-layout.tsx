import Image from "next/image";
import Link from "next/link";
import type { ProfileCardData } from "@/components/cards/profile-card-editor";
import type { PortfolioCardData } from "@/components/cards/portfolio-card-editor";
import type { MetricsCardData } from "@/lib/metrics-schema";
import type { ProfileLink } from "@/lib/links";
import {
  METRIC_SECTIONS,
  formatMetricValue,
  sectionHasAnyMetric,
  hasAnyMetric,
} from "@/lib/metrics-schema";
import { getLinkTypeConfig } from "@/lib/links";
import { PLATFORMS } from "@/lib/platforms";
import LinkIcon from "@/components/cards/link-icon";
import PlatformIcon from "@/components/cards/platform-icon";
import StarEmblem, { LEVEL_LABELS } from "@/components/cards/star-emblem";
import VideoPlayer from "@/components/cards/video-player";

type Props = {
  slug: string;
  profileData: ProfileCardData;
  metricsData: MetricsCardData;
  portfolioData: PortfolioCardData;
  resolvedLinks: ProfileLink[];
};

function prettyUrl(url: string): string {
  return url
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "");
}

export default function SunsetLayout({
  slug,
  profileData,
  metricsData,
  portfolioData,
  resolvedLinks,
}: Props) {
  const displayName = profileData.name || `@${slug}`;
  const initial = (profileData.name?.[0] ?? slug[0] ?? "?").toUpperCase();

  return (
    <main
      className="flex-1 text-orange-950"
      style={{
        background:
          "linear-gradient(135deg, #fed7aa 0%, #fda4af 35%, #f0abfc 70%, #fde68a 100%)",
      }}
    >
      <div className="mx-auto max-w-6xl px-6 py-14">
        {/* Profile — asymmetric: photo + name on left, info on right */}
        <section className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 items-end">
          <div>
            <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-orange-200 shadow-2xl ring-4 ring-white/70">
              {profileData.photo_url ? (
                <Image
                  src={profileData.photo_url}
                  alt={displayName}
                  fill
                  sizes="(min-width: 768px) 260px, 100vw"
                  className="object-cover"
                  unoptimized
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-6xl font-black text-orange-600">
                  {initial}
                </div>
              )}
            </div>
            {profileData.star_level && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur px-3 py-2 shadow">
                <StarEmblem level={profileData.star_level} size={28} />
                <span className="text-xs font-bold uppercase tracking-wider text-orange-900">
                  {LEVEL_LABELS[profileData.star_level]} Creator
                </span>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.95] text-orange-950">
              {displayName}
            </h1>
            {profileData.amazon_storefront ? (
              <a
                href={profileData.amazon_storefront}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-mono font-bold text-orange-800 hover:text-orange-950 underline underline-offset-4 decoration-orange-400 decoration-2"
              >
                {prettyUrl(profileData.amazon_storefront)}
              </a>
            ) : (
              <p className="mt-3 text-sm font-mono text-orange-800">
                mycard.to/{slug}
              </p>
            )}
            {profileData.bio && (
              <p className="mt-5 text-lg leading-relaxed font-medium text-orange-950/85 max-w-xl">
                {profileData.bio}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
              {profileData.email && (
                <a
                  href={`mailto:${profileData.email}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur px-3 py-1.5 hover:bg-white shadow-sm"
                >
                  ✉ {profileData.email}
                </a>
              )}
              {profileData.location && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/40 backdrop-blur px-3 py-1.5">
                  📍 {profileData.location}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Performance — warm cream cards */}
        {hasAnyMetric(metricsData) && (
          <section className="mt-14">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                The Numbers
              </h2>
              {metricsData.timeframe && (
                <p className="text-sm font-bold text-orange-800">
                  {metricsData.timeframe}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {METRIC_SECTIONS.filter((s) => sectionHasAnyMetric(metricsData, s.id)).map(
                (section) => {
                  const sectionData = metricsData[section.id] ?? {};
                  const filled = section.metrics.filter(
                    (m) => sectionData[m.key] && sectionData[m.key].trim().length > 0
                  );
                  return (
                    <div
                      key={section.id}
                      className="rounded-3xl bg-orange-50/80 backdrop-blur p-5 shadow-xl"
                    >
                      <h3 className="text-sm font-black uppercase tracking-wider text-orange-900 pb-3 border-b border-orange-200">
                        {section.title}
                      </h3>
                      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
                        {filled.map((metric) => (
                          <div key={metric.key}>
                            <p className="text-[10px] uppercase tracking-wider text-orange-700 font-semibold">
                              {metric.label}
                            </p>
                            <p className="mt-0.5 text-xl font-black tabular-nums text-orange-950">
                              {formatMetricValue(sectionData[metric.key], metric.format)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </section>
        )}

        {/* Find me — bold round pills */}
        {resolvedLinks.length > 0 && (
          <section className="mt-14">
            <p className="text-xs font-black uppercase tracking-[0.4em] text-orange-800 mb-5">
              Find Me
            </p>
            <div className="flex flex-wrap gap-3">
              {resolvedLinks.map((link) => {
                const cfg = getLinkTypeConfig(link.type);
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-3 rounded-full bg-white/80 backdrop-blur pl-1.5 pr-5 py-1.5 shadow-md hover:shadow-xl hover:bg-white transition"
                  >
                    <LinkIcon type={link.type} size={32} />
                    <span className="flex flex-col items-start leading-tight">
                      <span className="text-[10px] uppercase tracking-wider text-orange-700 font-bold">
                        {cfg.shortLabel}
                      </span>
                      <span className="text-sm font-black text-orange-950">
                        {link.label || cfg.label}
                      </span>
                    </span>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Portfolio — warm-bordered video cards */}
        {portfolioData.groups && portfolioData.groups.length > 0 && (
          <section className="mt-14">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-6">
              Selected Work
            </h2>
            <div className="space-y-10">
              {portfolioData.groups.map((group) => {
                const cfg = PLATFORMS[group.platform];
                return (
                  <div key={group.id}>
                    <div className="flex items-center gap-3 mb-4">
                      <PlatformIcon platform={group.platform} size={40} />
                      <div>
                        <h3 className="text-lg font-black text-orange-950 leading-tight">
                          {cfg.label}
                        </h3>
                        {group.label && (
                          <p className="text-xs font-bold text-orange-700 leading-tight">
                            {group.label}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                      {group.videos.map((v, i) => (
                        <VideoPlayer
                          key={i}
                          url={v.url}
                          title={v.title?.trim() || cfg.label + " video"}
                          thumbnailUrl={v.thumbnail_url}
                          hlsUrl={v.hls_url}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <footer className="mt-16 text-center text-xs font-bold uppercase tracking-[0.3em] text-orange-800">
          Made with{" "}
          <Link href="/" className="underline underline-offset-4 hover:text-orange-950">
            mycard.to
          </Link>
        </footer>
      </div>
    </main>
  );
}
