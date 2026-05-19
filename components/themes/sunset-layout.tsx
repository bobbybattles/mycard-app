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

export default function SunsetLayout({
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
    <main
      className="flex-1 text-orange-950"
      style={{
        background:
          "linear-gradient(135deg, #fed7aa 0%, #fda4af 35%, #f0abfc 70%, #fde68a 100%)",
      }}
    >
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Profile — compact horizontal card */}
        <section className="rounded-3xl bg-white/60 backdrop-blur px-5 py-5 sm:px-7 sm:py-6 shadow-xl">
          <div className="flex flex-row items-stretch gap-4 sm:gap-6">
            <div className="relative w-28 sm:w-36 shrink-0 self-stretch rounded-2xl overflow-hidden bg-orange-200 shadow-lg ring-2 ring-white/70 min-h-[120px]">
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
                <div className="absolute inset-0 flex items-center justify-center text-4xl font-black text-orange-600">
                  {initial}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter leading-[1] text-orange-950">
                {displayName}
              </h1>

              {(profileData.star_level || profileData.top_creator) && (
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
                  {profileData.star_level && (
                    <span className="inline-flex items-center gap-1.5">
                      <StarEmblem level={profileData.star_level} size={18} />
                      <span className="font-bold text-orange-900">
                        {LEVEL_LABELS[profileData.star_level]} Creator
                      </span>
                    </span>
                  )}
                  {profileData.top_creator && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/80 border border-amber-300 px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-orange-950">
                      ★ Top Creator
                    </span>
                  )}
                </div>
              )}

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm font-semibold">
                {profileData.amazon_storefront ? (
                  <a
                    href={profileData.amazon_storefront}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-bold text-orange-800 hover:text-orange-950 underline underline-offset-4 decoration-orange-400 decoration-2 break-all"
                  >
                    {prettyUrl(profileData.amazon_storefront)}
                  </a>
                ) : (
                  <span className="font-mono text-orange-800">mycard.to/{slug}</span>
                )}

                {profileData.email && (
                  <span className="inline-flex items-center gap-0.5">
                    <a
                      href={`mailto:${profileData.email}`}
                      className="text-orange-900 hover:text-orange-950 underline underline-offset-4 break-all"
                    >
                      ✉ {profileData.email}
                    </a>
                    <CopyButton value={profileData.email} className="text-orange-900 hover:text-orange-950" />
                  </span>
                )}
              </div>

              {profileData.bio && (
                <p className="mt-2 text-sm leading-relaxed font-medium text-orange-950/85">
                  {profileData.bio}
                </p>
              )}

              {profileData.location && (
                <p className="mt-2 text-xs sm:text-sm font-semibold text-orange-900/80">
                  📍 {profileData.location}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Performance — wide platforms full-width; single-section platforms side-by-side */}
        {hasAnyMetric(metricsData) && (
          <section className="mt-8">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-4">
              The Numbers
            </h2>
            <div className="flex flex-wrap gap-x-5 gap-y-6">
            {PLATFORM_GROUPS.filter((g) =>
              groupHasAnyMetric(normalizeMetrics(metricsData)[g.id], g)
            ).map((group) => {
              const groupData = normalizeMetrics(metricsData)[group.id];
              const visibleSections = group.sections.filter((s) =>
                sectionHasAnyMetric(groupData, s.id, s)
              );
              const isCompact = group.sections.length === 1;
              return (
                <div
                  key={group.id}
                  className={isCompact ? "flex-1 basis-[360px] min-w-[300px]" : "w-full"}
                >
                  <div className="flex items-baseline justify-between mb-3">
                    <h3 className="text-lg font-black tracking-tight text-orange-950">
                      {group.label}
                    </h3>
                    {groupData.timeframe && (
                      <p className="text-xs font-bold text-orange-800">
                        {groupData.timeframe}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-center gap-4">
                    {visibleSections.map((section) => {
                      const sectionData = getSectionMetrics(groupData, section.id) ?? {};
                      const filled = section.metrics.filter(
                        (m) => sectionData[m.key] && sectionData[m.key].trim().length > 0
                      );
                      return (
                        <div
                          key={section.id}
                          className="basis-[280px] grow max-w-md rounded-3xl bg-orange-50/80 backdrop-blur px-4 py-4 shadow-xl"
                        >
                          <h4 className="text-xs font-black uppercase tracking-wider text-orange-900 pb-2 border-b border-orange-200">
                            {section.title}
                          </h4>
                          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
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
                    })}
                  </div>
                </div>
              );
            })}
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

        {/* Rates — warm cream card */}
        {hasAnyRate(ratesData) && (
          <div className="mt-10">
            <RatesCard
              data={ratesData}
              className="rounded-3xl bg-orange-50/80 backdrop-blur px-5 py-5 sm:px-6 sm:py-5 shadow-xl"
              headingClassName="text-xl sm:text-2xl font-black tracking-tight text-orange-950 mb-3"
              titleClassName="text-orange-950"
              descriptionClassName="text-orange-950/70"
              amountClassName="text-orange-700"
              dividerClassName="divide-y divide-orange-200"
            />
          </div>
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
