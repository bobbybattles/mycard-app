import Image from "next/image";
import Link from "next/link";
import type { ProfileCardData } from "@/components/cards/profile-card-editor";
import type { PortfolioCardData } from "@/components/cards/portfolio-card-editor";
import type { MetricsCardData } from "@/lib/metrics-schema";
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

export default function NeonLayout({
  slug,
  profileData,
  metricsData,
  portfolioData,
  resolvedLinks,
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
          <div className="flex flex-row items-start gap-4 sm:gap-6">
            <div className="relative shrink-0">
              <div
                aria-hidden
                className="absolute inset-0 -m-1.5 rounded-2xl blur-lg opacity-70"
                style={{ background: "linear-gradient(135deg, #ec4899, #22d3ee)" }}
              />
              <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-2xl overflow-hidden bg-slate-800 ring-2 ring-cyan-300/50 flex items-center justify-center text-3xl font-bold text-cyan-200">
                {profileData.photo_url ? (
                  <Image
                    src={profileData.photo_url}
                    alt={displayName}
                    fill
                    sizes="(min-width: 640px) 128px, 96px"
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
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
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
                {profileData.star_level && (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-1">
                    <StarEmblem level={profileData.star_level} size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-200">
                      {LEVEL_LABELS[profileData.star_level]}
                    </span>
                  </div>
                )}
              </div>

              {profileData.amazon_storefront ? (
                <a
                  href={profileData.amazon_storefront}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs sm:text-sm font-mono text-cyan-300 hover:text-cyan-100 break-all"
                >
                  {prettyUrl(profileData.amazon_storefront)}
                </a>
              ) : (
                <p className="mt-1 text-xs sm:text-sm font-mono text-slate-400">
                  mycard.to/{slug}
                </p>
              )}

              {profileData.bio && (
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  {profileData.bio}
                </p>
              )}

              {profileData.email && (
                <p className="mt-3 text-xs sm:text-sm">
                  <a
                    href={`mailto:${profileData.email}`}
                    className="text-pink-300 hover:text-pink-100 break-all"
                  >
                    ✉ {profileData.email}
                  </a>
                </p>
              )}

              {profileData.location && (
                <p className="mt-1 text-xs sm:text-sm text-slate-400">
                  📍 {profileData.location}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Performance — one block per platform group, glassmorphism cards */}
        {hasAnyMetric(metricsData) && (
          <section className="mt-16 space-y-12">
            {PLATFORM_GROUPS.filter((g) =>
              groupHasAnyMetric(normalizeMetrics(metricsData)[g.id], g)
            ).map((group) => {
              const groupData = normalizeMetrics(metricsData)[group.id];
              const visibleSections = group.sections.filter((s) =>
                sectionHasAnyMetric(groupData, s.id, s)
              );
              return (
                <div key={group.id}>
                  <header className="text-center mb-8">
                    <p className="text-xs font-bold uppercase tracking-[0.4em] text-cyan-300">
                      {group.label}
                    </p>
                    {groupData.timeframe && (
                      <p className="mt-1 text-sm text-slate-400">{groupData.timeframe}</p>
                    )}
                  </header>
                  <div className="flex flex-wrap justify-center gap-5">
                    {visibleSections.map((section) => {
                      const sectionData = getSectionMetrics(groupData, section.id) ?? {};
                      const filled = section.metrics.filter(
                        (m) => sectionData[m.key] && sectionData[m.key].trim().length > 0
                      );
                      return (
                        <div
                          key={section.id}
                          className="basis-[280px] grow max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-2xl"
                        >
                          <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-300 pb-3 border-b border-white/10">
                            {section.title}
                          </h3>
                          <div className="mt-4 space-y-4">
                            {filled.map((metric) => (
                              <div key={metric.key}>
                                <p className="text-[10px] uppercase tracking-wider text-slate-400">
                                  {metric.label}
                                </p>
                                <p
                                  className="mt-0.5 text-2xl font-bold tabular-nums"
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
        )}

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
