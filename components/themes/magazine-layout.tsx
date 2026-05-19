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

export default function MagazineLayout({
  slug,
  profileData,
  metricsData,
  portfolioData,
  resolvedLinks,
}: Props) {
  const displayName = profileData.name || `@${slug}`;
  const initial = (profileData.name?.[0] ?? slug[0] ?? "?").toUpperCase();

  return (
    <main className="flex-1 bg-amber-50 font-sans text-slate-900">
      {/* Hero — split layout, editorial */}
      <section className="border-b-4 border-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="aspect-[4/5] relative bg-slate-900 overflow-hidden">
            {profileData.photo_url ? (
              <Image
                src={profileData.photo_url}
                alt={displayName}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
                unoptimized
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-amber-200 text-9xl font-serif">
                {initial}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-600 font-semibold mb-3">
              Media Kit · No. 01
            </p>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[0.95] font-black tracking-tight">
              {displayName}
            </h1>
            {profileData.amazon_storefront ? (
              <a
                href={profileData.amazon_storefront}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm font-mono text-slate-700 hover:text-slate-900 underline underline-offset-4 decoration-2"
              >
                {prettyUrl(profileData.amazon_storefront)}
              </a>
            ) : (
              <p className="mt-4 text-sm font-mono text-slate-700">
                mycard.to/{slug}
              </p>
            )}
            {profileData.star_level && (
              <div className="mt-5 inline-flex items-center gap-3 border-2 border-slate-900 px-3 py-2">
                <StarEmblem level={profileData.star_level} size={32} />
                <span className="text-xs uppercase tracking-widest font-bold">
                  {LEVEL_LABELS[profileData.star_level]} Creator
                </span>
              </div>
            )}
            {profileData.bio && (
              <p className="mt-6 text-lg leading-relaxed text-slate-800 font-serif">
                {profileData.bio}
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {profileData.email && (
                <a
                  href={`mailto:${profileData.email}`}
                  className="inline-flex items-center gap-2 underline underline-offset-4"
                >
                  ✉ {profileData.email}
                </a>
              )}
              {profileData.location && (
                <span className="inline-flex items-center gap-2 text-slate-700">
                  📍 {profileData.location}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Performance — wide horizontal strips per section */}
      {hasAnyMetric(metricsData) && (
        <section className="border-b-4 border-slate-900 bg-slate-900 text-amber-50">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <div className="flex items-baseline justify-between gap-4 mb-6">
              <h2 className="font-serif text-3xl sm:text-4xl font-black tracking-tight">
                The Numbers
              </h2>
              {metricsData.timeframe && (
                <p className="text-xs uppercase tracking-[0.3em] text-amber-200/70">
                  {metricsData.timeframe}
                </p>
              )}
            </div>
            <div className="space-y-6">
              {METRIC_SECTIONS.filter((s) => sectionHasAnyMetric(metricsData, s.id)).map(
                (section) => {
                  const sectionData = metricsData[section.id] ?? {};
                  const filled = section.metrics.filter(
                    (m) => sectionData[m.key] && sectionData[m.key].trim().length > 0
                  );
                  return (
                    <div key={section.id} className="border-t-2 border-amber-200/30 pt-5">
                      <p className="text-xs uppercase tracking-[0.3em] font-bold mb-3 text-amber-200">
                        {section.title}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-5">
                        {filled.map((metric) => (
                          <div key={metric.key}>
                            <p className="text-[10px] uppercase tracking-wider text-amber-200/70">
                              {metric.label}
                            </p>
                            <p className="font-serif text-3xl font-black tabular-nums mt-0.5">
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
          </div>
        </section>
      )}

      {/* Find me — branded square tiles */}
      {resolvedLinks.length > 0 && (
        <section className="border-b-4 border-slate-900">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <p className="text-xs uppercase tracking-[0.3em] font-bold mb-5 text-slate-700">
              Find Me Elsewhere
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {resolvedLinks.map((link) => {
                const cfg = getLinkTypeConfig(link.type);
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-2 border-2 border-slate-900 bg-amber-100 p-4 hover:bg-slate-900 hover:text-amber-100 transition"
                  >
                    <LinkIcon type={link.type} size={40} />
                    <span className="text-xs font-bold uppercase tracking-wider text-center">
                      {link.label || cfg.shortLabel}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Portfolio — bold group headers + clean video grid */}
      {portfolioData.groups && portfolioData.groups.length > 0 && (
        <section>
          <div className="mx-auto max-w-6xl px-6 py-12 space-y-12">
            <p className="text-xs uppercase tracking-[0.3em] font-bold text-slate-700">
              Selected Work
            </p>
            {portfolioData.groups.map((group) => {
              const cfg = PLATFORMS[group.platform];
              return (
                <div key={group.id}>
                  <div className="flex items-end justify-between gap-4 mb-5 border-b-2 border-slate-900 pb-3">
                    <div className="flex items-center gap-3">
                      <PlatformIcon platform={group.platform} size={36} />
                      <h3 className="font-serif text-2xl sm:text-3xl font-black tracking-tight">
                        {cfg.label}
                      </h3>
                    </div>
                    {group.label && (
                      <span className="text-xs uppercase tracking-widest text-slate-600">
                        {group.label}
                      </span>
                    )}
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

      <footer className="border-t-2 border-slate-900 py-6 text-center text-xs uppercase tracking-[0.3em] text-slate-700">
        Made with{" "}
        <Link href="/" className="underline underline-offset-4">
          mycard.to
        </Link>
      </footer>
    </main>
  );
}
