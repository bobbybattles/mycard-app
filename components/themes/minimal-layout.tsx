import Image from "next/image";
import Link from "next/link";
import type { ProfileCardData } from "@/components/cards/profile-card-editor";
import type { PortfolioCardData } from "@/components/cards/portfolio-card-editor";
import type { MetricsCardData } from "@/lib/metrics-schema";
import { hasAnyRate, type RatesCardData } from "@/lib/rates";
import type { ProfileLink } from "@/lib/links";
import {
  PLATFORM_GROUPS,
  AMAZON_COMBINED_SECTION,
  formatMetricValue,
  getSectionMetrics,
  groupHasAnyMetric,
  hasAnyMetric,
  normalizeMetrics,
  sectionHasAnyMetric,
  computeCombinedAmazon,
  combinedAmazonHasAnyMetric,
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

export default function MinimalLayout({
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
    <main className="flex-1 bg-white text-slate-900">
      {/* Profile + Find Me side-by-side */}
      <section className="mx-auto max-w-[1400px] px-6 pt-10 pb-8">
        <div
          className={
            resolvedLinks.length > 0
              ? "grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-stretch"
              : ""
          }
        >
        <div className="flex flex-row items-start gap-4 sm:gap-6">
          <div className="relative h-28 w-28 sm:h-48 sm:w-48 shrink-0 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center text-2xl font-light text-slate-600">
            {profileData.photo_url ? (
              <Image
                src={profileData.photo_url}
                alt={displayName}
                fill
                sizes="(min-width: 640px) 192px, 112px"
                className="object-cover"
                unoptimized
                priority
              />
            ) : (
              initial
            )}
          </div>

          <div className="flex-1 min-w-0 max-w-md">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extralight tracking-tight">
              {displayName}
            </h1>

            {(profileData.star_level || profileData.top_creator) && (
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-xs uppercase tracking-[0.25em]">
                {profileData.star_level && (
                  <span className="inline-flex items-center gap-1.5">
                    <StarEmblem level={profileData.star_level} size={16} />
                    <span className="text-slate-700">
                      {LEVEL_LABELS[profileData.star_level]} Creator
                    </span>
                  </span>
                )}
                {profileData.top_creator && (
                  <span className="text-slate-700 border border-slate-300 px-2 py-0.5">
                    Top Creator
                  </span>
                )}
              </div>
            )}

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-xs uppercase tracking-[0.25em]">
              {profileData.amazon_storefront ? (
                <a
                  href={profileData.amazon_storefront}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-slate-500 hover:text-slate-900 break-all"
                >
                  {prettyUrl(profileData.amazon_storefront)}
                </a>
              ) : (
                <span className="font-mono text-slate-500">mycard.to/{slug}</span>
              )}

              {profileData.email && (
                <span className="inline-flex items-center gap-0.5">
                  <a
                    href={`mailto:${profileData.email}`}
                    className="text-slate-500 hover:text-slate-900 break-all"
                  >
                    {profileData.email}
                  </a>
                  <CopyButton value={profileData.email} className="text-slate-500 hover:text-slate-900" />
                </span>
              )}
            </div>

            {profileData.bio && (
              <p className="mt-2 text-sm leading-relaxed text-slate-700 font-light">
                {profileData.bio}
              </p>
            )}

            {profileData.location && (
              <p className="mt-2 text-[10px] sm:text-xs uppercase tracking-[0.25em] text-slate-500">
                {profileData.location}
              </p>
            )}
          </div>
        </div>

        {/* Find Me — side card next to profile */}
        {resolvedLinks.length > 0 && (
          <section className="border border-slate-200 rounded-xl px-5 py-5">
            <p className="text-[10px] uppercase tracking-[0.4em] text-slate-500 mb-3">
              Find Me
            </p>
            <div className="flex flex-wrap gap-2">
              {resolvedLinks.map((link) => {
                const cfg = getLinkTypeConfig(link.type);
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-1.5 pr-3.5 py-1.5 hover:border-slate-400 transition"
                  >
                    <LinkIcon type={link.type} size={28} />
                    <span className="flex flex-col items-start leading-tight">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-light">
                        {cfg.shortLabel}
                      </span>
                      <span className="text-xs font-light text-slate-900">
                        {link.label || cfg.label}
                      </span>
                    </span>
                  </a>
                );
              })}
            </div>
          </section>
        )}
        </div>
      </section>

      {/* Performance — wide platforms full-width; single-section platforms side-by-side */}
      {hasAnyMetric(metricsData) && (() => {
        const combineAmazon = !!metricsData.combine_amazon;
        const norm = normalizeMetrics(metricsData);
        const visibleGroups = PLATFORM_GROUPS.filter((g) => {
          if (g.id === "amazon" && combineAmazon)
            return combinedAmazonHasAnyMetric(norm.amazon);
          return groupHasAnyMetric(norm[g.id], g);
        });
        return (
        <section className="border-t border-slate-200">
          <div className="mx-auto max-w-[1400px] px-6 py-8">
            <div className="flex flex-wrap gap-4">
            {visibleGroups.map((group) => {
              const groupData = norm[group.id];
              const isAmazonCombined = group.id === "amazon" && combineAmazon;
              const renderSections = isAmazonCombined
                ? [{ section: AMAZON_COMBINED_SECTION, data: computeCombinedAmazon(groupData) }]
                : group.sections
                    .filter((s) => sectionHasAnyMetric(groupData, s.id, s))
                    .map((s) => ({ section: s, data: getSectionMetrics(groupData, s.id) ?? {} }));
              const isCompact = isAmazonCombined || group.sections.length === 1;
              return (
                <div
                  key={group.id}
                  className={
                    "rounded-2xl border border-slate-200 bg-white px-5 py-5 " +
                    (isCompact ? "flex-1 basis-[320px] min-w-[280px]" : "w-full")
                  }
                >
                  <div className="text-center mb-3">
                    <span className="text-[10px] uppercase tracking-[0.4em] text-slate-500">
                      {group.label}
                    </span>
                    {groupData.timeframe && (
                      <span className="ml-2 text-xs text-slate-500 font-light">
                        · {groupData.timeframe}
                      </span>
                    )}
                  </div>
                  <div className="space-y-4">
                    {renderSections.map(({ section, data: sectionData }) => {
                      const filled = section.metrics.filter(
                        (m) => sectionData[m.key] && sectionData[m.key].trim().length > 0
                      );
                      return (
                        <div key={section.id}>
                          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 text-center mb-2 pb-2 border-b border-slate-100">
                            {section.title}
                          </p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-center">
                            {filled.map((metric) => (
                              <div key={metric.key} className="min-w-0">
                                <p className="text-xl sm:text-2xl font-extralight tabular-nums tracking-tight truncate">
                                  {formatMetricValue(sectionData[metric.key], metric.format)}
                                </p>
                                <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-slate-500 truncate">
                                  {metric.label}
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
        );
      })()}

      {/* Rates — clean hairlines */}
      {hasAnyRate(ratesData) && (
        <section className="border-t border-slate-200">
          <div className="mx-auto max-w-[1400px] px-6 py-8">
            <RatesCard
              data={ratesData}
              className=""
              headingClassName="text-[10px] uppercase tracking-[0.5em] text-slate-400 text-center mb-5"
              titleClassName="text-slate-900 font-light"
              descriptionClassName="text-slate-500 font-light"
              amountClassName="text-slate-900 font-light"
              dividerClassName="divide-y divide-slate-200"
            />
          </div>
        </section>
      )}

      {/* Portfolio — clean grid no chrome */}
      {portfolioData.groups && portfolioData.groups.length > 0 && (
        <section className="border-t border-slate-200">
          <div className="mx-auto max-w-[1400px] px-6 py-10 space-y-8">
            <p className="text-[10px] uppercase tracking-[0.5em] text-slate-400 text-center">
              Work
            </p>
            {portfolioData.groups.map((group) => {
              const cfg = PLATFORMS[group.platform];
              return (
                <div key={group.id}>
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <PlatformIcon platform={group.platform} size={28} />
                    <h3 className="text-sm uppercase tracking-[0.3em] font-light text-slate-700">
                      {cfg.label}
                      {group.label && (
                        <span className="ml-2 text-slate-400 normal-case tracking-normal text-xs">
                          · {group.label}
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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

      <footer className="border-t border-slate-200 py-10 text-center text-[10px] uppercase tracking-[0.5em] text-slate-400">
        Made with{" "}
        <Link href="/" className="underline underline-offset-4 hover:text-slate-900">
          mycard.to
        </Link>
      </footer>
    </main>
  );
}
