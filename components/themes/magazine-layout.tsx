import Image from "next/image";
import Link from "next/link";
import type { ProfileCardData } from "@/components/cards/profile-card-editor";
import type { PortfolioCardData } from "@/components/cards/portfolio-card-editor";
import type { MetricsCardData } from "@/lib/metrics-schema";
import { hasAnyRate, type RatesCardData } from "@/lib/rates";
import type { ProfileLink } from "@/lib/links";
import {
  PLATFORM_GROUPS,
  formatMetricValue,
  getSectionMetrics,
  groupHasAnyMetric,
  hasAnyMetric,
  normalizeMetrics,
  sectionHasAnyMetric,
} from "@/lib/metrics-schema";
import { getLinkTypeConfig } from "@/lib/links";
import { PLATFORMS } from "@/lib/platforms";
import LinkIcon from "@/components/cards/link-icon";
import PlatformIcon from "@/components/cards/platform-icon";
import StarEmblem, { LEVEL_LABELS } from "@/components/cards/star-emblem";
import VideoPlayer from "@/components/cards/video-player";
import CopyButton from "@/components/cards/copy-button";
import RatesCard from "@/components/cards/rates-card";

type Props = {
  slug: string;
  profileData: ProfileCardData;
  metricsData: MetricsCardData;
  portfolioData: PortfolioCardData;
  resolvedLinks: ProfileLink[];
  ratesData: RatesCardData;
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
  ratesData,
}: Props) {
  const displayName = profileData.name || `@${slug}`;
  const initial = (profileData.name?.[0] ?? slug[0] ?? "?").toUpperCase();

  return (
    <main className="flex-1 bg-amber-50 font-sans text-slate-900">
      {/* Hero — compact editorial card */}
      <section className="border-b-4 border-slate-900">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <p className="text-[10px] uppercase tracking-[0.4em] text-slate-600 font-semibold mb-3">
            Media Kit · No. 01
          </p>
          <div className="flex flex-row items-stretch gap-4 sm:gap-6">
            <div className="relative w-28 sm:w-36 shrink-0 self-stretch bg-slate-900 overflow-hidden min-h-[140px]">
              {profileData.photo_url ? (
                <Image
                  src={profileData.photo_url}
                  alt={displayName}
                  fill
                  sizes="(min-width: 640px) 144px, 112px"
                  className="object-cover"
                  unoptimized
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-amber-200 text-5xl font-serif">
                  {initial}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl leading-[0.95] font-black tracking-tight">
                {displayName}
              </h1>

              {(profileData.star_level || profileData.top_creator) && (
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
                  {profileData.star_level && (
                    <span className="inline-flex items-center gap-1.5">
                      <StarEmblem level={profileData.star_level} size={18} />
                      <span className="font-bold uppercase tracking-wider text-slate-800">
                        {LEVEL_LABELS[profileData.star_level]} Creator
                      </span>
                    </span>
                  )}
                  {profileData.top_creator && (
                    <span className="inline-flex items-center gap-1 border-2 border-slate-900 bg-amber-100 px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                      ★ Top Creator
                    </span>
                  )}
                </div>
              )}

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
                {profileData.amazon_storefront ? (
                  <a
                    href={profileData.amazon_storefront}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-slate-700 hover:text-slate-900 underline underline-offset-4 decoration-2 break-all"
                  >
                    {prettyUrl(profileData.amazon_storefront)}
                  </a>
                ) : (
                  <span className="font-mono text-slate-700">mycard.to/{slug}</span>
                )}

                {profileData.email && (
                  <span className="inline-flex items-center gap-0.5">
                    <a
                      href={`mailto:${profileData.email}`}
                      className="underline underline-offset-4 break-all"
                    >
                      ✉ {profileData.email}
                    </a>
                    <CopyButton value={profileData.email} className="text-slate-700 hover:text-slate-900" />
                  </span>
                )}
              </div>

              {profileData.bio && (
                <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-800 font-serif">
                  {profileData.bio}
                </p>
              )}

              {profileData.location && (
                <p className="mt-2 text-xs sm:text-sm">
                  <span className="inline-flex items-center gap-2 text-slate-700">
                    📍 {profileData.location}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Performance — wide platforms full-width; single-section platforms side-by-side */}
      {hasAnyMetric(metricsData) && (
        <section className="border-b-4 border-slate-900 bg-slate-900 text-amber-50">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <h2 className="font-serif text-2xl sm:text-3xl font-black tracking-tight mb-5">
              The Numbers
            </h2>
            <div className="flex flex-wrap gap-x-6 gap-y-6">
            {PLATFORM_GROUPS.filter((g) =>
              groupHasAnyMetric(normalizeMetrics(metricsData)[g.id], g)
            ).map((group) => {
              const groupData = normalizeMetrics(metricsData)[group.id];
              const isCompact = group.sections.length === 1;
              return (
                <div
                  key={group.id}
                  className={`border-t-2 border-amber-200/30 pt-3 ${isCompact ? "flex-1 basis-[360px] min-w-[300px]" : "w-full"}`}
                >
                  <div className="flex items-baseline justify-between gap-4 mb-3">
                    <p className="text-sm uppercase tracking-[0.3em] font-bold text-amber-200">
                      {group.label}
                    </p>
                    {groupData.timeframe && (
                      <p className="text-xs uppercase tracking-[0.3em] text-amber-200/70">
                        {groupData.timeframe}
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    {group.sections
                      .filter((s) => sectionHasAnyMetric(groupData, s.id, s))
                      .map((section) => {
                        const sectionData = getSectionMetrics(groupData, section.id) ?? {};
                        const filled = section.metrics.filter(
                          (m) => sectionData[m.key] && sectionData[m.key].trim().length > 0
                        );
                        return (
                          <div key={section.id}>
                            <p className="text-[10px] uppercase tracking-[0.25em] text-amber-200/60 mb-1.5">
                              {section.title}
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
                              {filled.map((metric) => (
                                <div key={metric.key}>
                                  <p className="text-[10px] uppercase tracking-wider text-amber-200/70">
                                    {metric.label}
                                  </p>
                                  <p className="font-serif text-2xl font-black tabular-nums mt-0.5">
                                    {formatMetricValue(sectionData[metric.key], metric.format)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })}
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

      {/* Rates — editorial card */}
      {hasAnyRate(ratesData) && (
        <section className="border-b-4 border-slate-900">
          <div className="mx-auto max-w-6xl px-6 py-8">
            <RatesCard
              data={ratesData}
              className=""
              headingClassName="font-serif text-2xl sm:text-3xl font-black tracking-tight mb-4"
              titleClassName="text-slate-900"
              descriptionClassName="text-slate-700"
              amountClassName="font-serif text-slate-900"
              dividerClassName="divide-y divide-slate-300"
            />
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
