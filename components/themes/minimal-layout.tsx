import Image from "next/image";
import Link from "next/link";
import type { ProfileCardData } from "@/components/cards/profile-card-editor";
import type { PortfolioCardData } from "@/components/cards/portfolio-card-editor";
import type { MetricsCardData } from "@/lib/metrics-schema";
import type { ProfileLink } from "@/lib/links";
import {
  PLATFORM_GROUPS,
  formatMetricValue,
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

export default function MinimalLayout({
  slug,
  profileData,
  metricsData,
  portfolioData,
  resolvedLinks,
}: Props) {
  const displayName = profileData.name || `@${slug}`;
  const initial = (profileData.name?.[0] ?? slug[0] ?? "?").toUpperCase();

  return (
    <main className="flex-1 bg-white text-slate-900">
      {/* Profile — small photo, big name, thin dividers */}
      <section className="mx-auto max-w-3xl px-6 pt-20 pb-12 text-center">
        <div className="relative mx-auto h-20 w-20 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center text-2xl font-light text-slate-600">
          {profileData.photo_url ? (
            <Image
              src={profileData.photo_url}
              alt={displayName}
              fill
              sizes="80px"
              className="object-cover"
              unoptimized
              priority
            />
          ) : (
            initial
          )}
        </div>
        <h1 className="mt-8 text-5xl sm:text-6xl font-extralight tracking-tight">
          {displayName}
        </h1>
        {profileData.amazon_storefront ? (
          <a
            href={profileData.amazon_storefront}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-xs font-mono uppercase tracking-[0.3em] text-slate-500 hover:text-slate-900"
          >
            {prettyUrl(profileData.amazon_storefront)}
          </a>
        ) : (
          <p className="mt-3 text-xs font-mono uppercase tracking-[0.3em] text-slate-500">
            mycard.to/{slug}
          </p>
        )}
        {profileData.star_level && (
          <p className="mt-6 text-xs uppercase tracking-[0.4em] text-slate-500">
            {LEVEL_LABELS[profileData.star_level]} Creator
          </p>
        )}
        {profileData.bio && (
          <p className="mt-8 mx-auto max-w-lg text-base leading-relaxed text-slate-700 font-light">
            {profileData.bio}
          </p>
        )}
        {(profileData.email || profileData.location) && (
          <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs uppercase tracking-[0.25em] text-slate-500">
            {profileData.email && (
              <a
                href={`mailto:${profileData.email}`}
                className="hover:text-slate-900"
              >
                {profileData.email}
              </a>
            )}
            {profileData.location && (
              <span>{profileData.location}</span>
            )}
          </div>
        )}
      </section>

      {/* Performance — one block per platform group, huge numbers + hairlines */}
      {hasAnyMetric(metricsData) && (
        <section className="border-t border-slate-200">
          <div className="mx-auto max-w-5xl px-6 py-16 space-y-16">
            {PLATFORM_GROUPS.filter((g) =>
              groupHasAnyMetric(normalizeMetrics(metricsData)[g.id], g)
            ).map((group) => {
              const groupData = normalizeMetrics(metricsData)[group.id];
              return (
                <div key={group.id}>
                  <div className="text-center mb-12">
                    <p className="text-[10px] uppercase tracking-[0.5em] text-slate-400">
                      {group.label}
                    </p>
                    {groupData.timeframe && (
                      <p className="mt-1 text-sm text-slate-600 font-light">
                        {groupData.timeframe}
                      </p>
                    )}
                  </div>
                  <div className="space-y-12">
                    {group.sections
                      .filter((s) => sectionHasAnyMetric(groupData, s.id, s))
                      .map((section) => {
                        const sectionData = groupData[section.id] ?? {};
                        const filled = section.metrics.filter(
                          (m) => sectionData[m.key] && sectionData[m.key].trim().length > 0
                        );
                        return (
                          <div key={section.id}>
                            <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400 text-center mb-6">
                              {section.title}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-10 text-center">
                              {filled.map((metric) => (
                                <div key={metric.key}>
                                  <p className="text-4xl sm:text-5xl font-extralight tabular-nums tracking-tight">
                                    {formatMetricValue(sectionData[metric.key], metric.format)}
                                  </p>
                                  <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-slate-500">
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
        </section>
      )}

      {/* Find me — text links with subtle icons */}
      {resolvedLinks.length > 0 && (
        <section className="border-t border-slate-200">
          <div className="mx-auto max-w-3xl px-6 py-14 text-center">
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

      {/* Portfolio — clean grid no chrome */}
      {portfolioData.groups && portfolioData.groups.length > 0 && (
        <section className="border-t border-slate-200">
          <div className="mx-auto max-w-6xl px-6 py-16 space-y-14">
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
