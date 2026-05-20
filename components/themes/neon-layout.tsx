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

export default function NeonLayout({
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
    <main className="flex-1 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div
        aria-hidden
        className="absolute -top-32 -left-20 h-96 w-96 rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ background: "radial-gradient(circle, #ec4899 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="absolute top-20 right-0 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(circle, #22d3ee 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-10 z-10">
        {/* Profile — compact horizontal card with glow ring around photo */}
        <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-5 py-5 sm:px-7 sm:py-6 shadow-2xl">
          <div className="flex flex-row items-stretch gap-4 sm:gap-6">
            <div className="relative shrink-0 w-28 sm:w-36 self-stretch min-h-[120px]">
              <div
                aria-hidden
                className="absolute inset-0 -m-1.5 rounded-2xl blur-lg opacity-70"
                style={{ background: "linear-gradient(135deg, #ec4899, #22d3ee)" }}
              />
              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-800 ring-2 ring-cyan-300/50 flex items-center justify-center text-3xl font-bold text-cyan-200">
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
                  initial
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h1
                className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight"
                style={{
                  background:
                    "linear-gradient(90deg, #f472b6 0%, #c4b5fd 50%, #67e8f9 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {displayName}
              </h1>

              {(profileData.star_level || profileData.top_creator) && (
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
                  {profileData.star_level && (
                    <span className="inline-flex items-center gap-1.5">
                      <StarEmblem level={profileData.star_level} size={18} />
                      <span className="font-semibold text-cyan-200">
                        {LEVEL_LABELS[profileData.star_level]} Creator
                      </span>
                    </span>
                  )}
                  {profileData.top_creator && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/20 border border-amber-300/40 px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-200">
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
                    className="font-mono text-cyan-300 hover:text-cyan-100 break-all"
                  >
                    {prettyUrl(profileData.amazon_storefront)}
                  </a>
                ) : (
                  <span className="font-mono text-slate-400">mycard.to/{slug}</span>
                )}

                {profileData.email && (
                  <span className="inline-flex items-center gap-0.5">
                    <a
                      href={`mailto:${profileData.email}`}
                      className="text-pink-300 hover:text-pink-100 break-all"
                    >
                      ✉ {profileData.email}
                    </a>
                    <CopyButton value={profileData.email} className="text-pink-300 hover:text-pink-100" />
                  </span>
                )}
              </div>

              {profileData.bio && (
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  {profileData.bio}
                </p>
              )}

              {profileData.location && (
                <p className="mt-2 text-xs sm:text-sm text-slate-400">
                  📍 {profileData.location}
                </p>
              )}
            </div>
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
          <section className="mt-6 flex flex-wrap gap-x-5 gap-y-6">
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
                  className={isCompact ? "flex-1 basis-[360px] min-w-[300px]" : "w-full"}
                >
                  <header className="text-center mb-3">
                    <span className="text-xs font-bold uppercase tracking-[0.4em] text-cyan-300">
                      {group.label}
                    </span>
                    {groupData.timeframe && (
                      <span className="ml-3 text-xs text-slate-400">
                        · {groupData.timeframe}
                      </span>
                    )}
                  </header>
                  <div className="flex flex-wrap justify-center gap-4">
                    {renderSections.map(({ section, data: sectionData }) => {
                      const filled = section.metrics.filter(
                        (m) => sectionData[m.key] && sectionData[m.key].trim().length > 0
                      );
                      return (
                        <div
                          key={section.id}
                          className="basis-[280px] grow max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-4 shadow-2xl"
                        >
                          <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-300 pb-2 border-b border-white/10">
                            {section.title}
                          </h3>
                          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                            {filled.map((metric) => (
                              <div key={metric.key} className="min-w-0">
                                <p className="text-[10px] uppercase tracking-wider text-slate-400">
                                  {metric.label}
                                </p>
                                <p
                                  className="mt-0.5 text-xl font-bold tabular-nums truncate"
                                  style={{
                                    background:
                                      "linear-gradient(90deg, #f472b6, #c4b5fd)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                  }}
                                >
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
          </section>
          );
        })()}

        {/* Find me — glowing pills */}
        {resolvedLinks.length > 0 && (
          <section className="mt-16 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-cyan-300 mb-5">
              Find Me
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {resolvedLinks.map((link) => {
                const cfg = getLinkTypeConfig(link.type);
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 backdrop-blur-xl pl-1.5 pr-4 py-1.5 hover:bg-white/10 hover:border-cyan-300/40 transition shadow-lg"
                  >
                    <LinkIcon type={link.type} size={32} />
                    <span className="flex flex-col items-start leading-tight">
                      <span className="text-[10px] uppercase tracking-wider text-cyan-300/80 font-semibold">
                        {cfg.shortLabel}
                      </span>
                      <span className="text-sm font-semibold text-slate-100">
                        {link.label || cfg.label}
                      </span>
                    </span>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Rates — glassmorphism card */}
        {hasAnyRate(ratesData) && (
          <div className="mt-12">
            <RatesCard
              data={ratesData}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-5 py-5 sm:px-6 sm:py-5 shadow-2xl"
              headingClassName="text-xs font-bold uppercase tracking-[0.4em] text-cyan-300 mb-3"
              titleClassName="text-slate-100"
              descriptionClassName="text-slate-400"
              amountClassName="text-pink-300"
              dividerClassName="divide-y divide-white/10"
            />
          </div>
        )}

        {/* Portfolio — glassy cards */}
        {portfolioData.groups && portfolioData.groups.length > 0 && (
          <section className="mt-16">
            <header className="text-center mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-cyan-300">
                Portfolio
              </p>
            </header>
            <div className="space-y-10">
              {portfolioData.groups.map((group) => {
                const cfg = PLATFORMS[group.platform];
                return (
                  <div key={group.id}>
                    <div className="flex items-center gap-3 mb-4 justify-center sm:justify-start">
                      <PlatformIcon platform={group.platform} size={36} />
                      <div>
                        <h3 className="text-base font-bold text-slate-100 leading-tight">
                          {cfg.label}
                        </h3>
                        {group.label && (
                          <p className="text-xs text-slate-400 leading-tight">
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

        <footer className="mt-16 text-center text-xs uppercase tracking-[0.4em] text-cyan-300/60">
          Made with{" "}
          <Link href="/" className="text-cyan-300 hover:text-cyan-100">
            mycard.to
          </Link>
        </footer>
      </div>
    </main>
  );
}
