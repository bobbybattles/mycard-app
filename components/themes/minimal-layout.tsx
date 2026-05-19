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
      {/* Profile — compact horizontal card */}
      <section className="mx-auto max-w-3xl px-6 pt-10 pb-8">
        <div className="flex flex-row items-stretch gap-4 sm:gap-6">
          <div className="relative w-24 sm:w-32 shrink-0 self-stretch rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center text-2xl font-light text-slate-600 min-h-[120px]">
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

          <div className="flex-1 min-w-0">
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
      </section>

      {/* Performance — wide platforms full-width; single-section platforms side-by-side */}
      {hasAnyMetric(metricsData) && (
        <section className="border-t border-slate-200">
          <div className="mx-auto max-w-5xl px-6 py-8">
            <div className="flex flex-wrap gap-x-8 gap-y-8">
            {PLATFORM_GROUPS.filter((g) =>
              groupHasAnyMetric(normalizeMetrics(metricsData)[g.id], g)
            ).map((group) => {
              const groupData = normalizeMetrics(metricsData)[group.id];
              const isCompact = group.sections.length === 1;
              return (
                <div
                  key={group.id}
                  className={isCompact ? "flex-1 basis-[360px] min-w-[300px]" : "w-full"}
                >
                  <div className="text-center mb-4">
                    <span className="text-[10px] uppercase tracking-[0.5em] text-slate-400">
                      {group.label}
                    </span>
                    {groupData.timeframe && (
                      <span className="ml-3 text-xs text-slate-500 font-light">
                        · {groupData.timeframe}
                      </span>
                    )}
                  </div>
                  <div className="space-y-5">
                    {group.sections
                      .filter((s) => sectionHasAnyMetric(groupData, s.id, s))
                      .map((section) => {
                        const sectionData = getSectionMetrics(groupData, section.id) ?? {};
                        const filled = section.metrics.filter(
                          (m) => sectionData[m.key] && sectionData[m.key].trim().length > 0
                        );
                        return (
                          <div key={section.id}>
                            <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400 text-center mb-3">
                              {section.title}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5 text-center">
                              {filled.map((metric) => (
                                <div key={metric.key}>
                                  <p className="text-2xl sm:text-3xl font-extralight tabular-nums tracking-tight">
                                    {formatMetricValue(sectionData[metric.key], metric.format)}
                                  </p>
                                  <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-slate-500">
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
      )}

      {/* Find me — text links with subtle icons */}
      {resolvedLinks.length > 0 && (
        <section className="border-t border-slate-200">
          <div className="mx-auto max-w-3xl px-6 py-8 text-center">
            <p className="text-[10px] uppercase tracking-[0.5em] text-slate-400 mb-6">
              Elsewhere
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
              {resolvedLinks.map((link) => {
                const cfg = getLinkTypeConfig(link.type);
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900 transition"
                  >
                    <LinkIcon type={link.type} size={20} />
                    <span className="underline underline-offset-4 decoration-slate-300 hover:decoration-slate-900">
                      {link.label || cfg.shortLabel}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Rates — clean hairlines */}
      {hasAnyRate(ratesData) && (
        <section className="border-t border-slate-200">
          <div className="mx-auto max-w-3xl px-6 py-8">
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
          <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
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
