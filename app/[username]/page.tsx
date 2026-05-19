import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileCard from "@/components/cards/profile-card";
import type { ProfileCardData } from "@/components/cards/profile-card-editor";
import MetricsCard from "@/components/cards/metrics-card";
import { hasAnyMetric, type MetricsCardData } from "@/lib/metrics-schema";
import PortfolioCard from "@/components/cards/portfolio-card";
import type { PortfolioCardData } from "@/components/cards/portfolio-card-editor";
import PlatformLinks from "@/components/cards/platform-links";
import RatesCard from "@/components/cards/rates-card";
import { hasAnyRate, type RatesCardData } from "@/lib/rates";
import type { LinksCardData, ProfileLink } from "@/lib/links";
import { getDesign } from "@/lib/themes";
import MagazineLayout from "@/components/themes/magazine-layout";
import MinimalLayout from "@/components/themes/minimal-layout";
import NeonLayout from "@/components/themes/neon-layout";
import SunsetLayout from "@/components/themes/sunset-layout";

// Public kit page rendered at mycard.to/<slug>.
// Dispatches to one of 5 layouts based on the kit's chosen design theme.
export const dynamic = "force-dynamic";

export default async function PublicKitPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const slug = username.toLowerCase();
  const supabase = await createClient();

  const { data: kit } = await supabase
    .from("kits")
    .select("id, user_id, slug, is_published, theme")
    .eq("slug", slug)
    .maybeSingle();

  if (!kit || !kit.is_published) return notFound();

  const { data: cards } = await supabase
    .from("cards")
    .select("id, card_type, position, is_visible, data")
    .eq("kit_id", kit.id)
    .eq("is_visible", true)
    .order("position", { ascending: true });

  const profileCard = cards?.find((c) => c.card_type === "profile");
  const metricsCard = cards?.find((c) => c.card_type === "metrics");
  const portfolioCard = cards?.find((c) => c.card_type === "portfolio");
  const linksCard = cards?.find((c) => c.card_type === "links");
  const ratesCard = cards?.find((c) => c.card_type === "rates");
  const knownTypes = new Set([
    "profile",
    "metrics",
    "portfolio",
    "links",
    "rates",
  ]);
  const unknownCards = (cards ?? []).filter((c) => !knownTypes.has(c.card_type));

  const profileData = (profileCard?.data ?? {}) as ProfileCardData;
  const metricsData = (metricsCard?.data ?? {}) as MetricsCardData;
  const portfolioData = (portfolioCard?.data ?? { groups: [] }) as PortfolioCardData;
  const linksData = (linksCard?.data ?? { links: [] }) as LinksCardData;
  const ratesData = (ratesCard?.data ?? { items: [] }) as RatesCardData;

  const resolvedLinks: ProfileLink[] =
    linksData.links && linksData.links.length > 0
      ? linksData.links
      : [
          ...(profileData.platform_links ?? []).map((l) => ({
            id: l.id,
            type: l.platform,
            label: l.label,
            url: l.url,
          })),
          ...(profileData.social_profiles ?? []).map((s) => ({
            id: s.id,
            type: s.type,
            label: s.label,
            url: s.url,
          })),
        ];

  const design = getDesign(kit.theme as Record<string, unknown> | null);
  const kitSlug = kit.slug ?? slug;
  const layoutProps = {
    slug: kitSlug,
    profileData,
    metricsData,
    portfolioData,
    resolvedLinks,
    ratesData,
  };

  // Each non-classic design has its own self-contained page layout.
  if (design === "magazine") return <MagazineLayout {...layoutProps} />;
  if (design === "minimal") return <MinimalLayout {...layoutProps} />;
  if (design === "neon") return <NeonLayout {...layoutProps} />;
  if (design === "sunset") return <SunsetLayout {...layoutProps} />;

  // Classic — the original look. Inline so we can keep showing unknown
  // card_types for debugging until those get proper renderers.
  return (
    <main className="flex-1 bg-gradient-to-b from-pink-50 to-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <ProfileCard username={kitSlug} data={profileData} />

        {hasAnyMetric(metricsData) && (
          <div className="mt-12">
            <MetricsCard data={metricsData} />
          </div>
        )}

        {resolvedLinks.length > 0 && (
          <div className="mt-12">
            <PlatformLinks links={resolvedLinks} />
          </div>
        )}

        {hasAnyRate(ratesData) && (
          <div className="mt-12">
            <RatesCard data={ratesData} />
          </div>
        )}

        {((portfolioData.groups && portfolioData.groups.length > 0) ||
          (portfolioData.videos && portfolioData.videos.length > 0)) && (
          <div className="mt-14">
            <PortfolioCard data={portfolioData} />
          </div>
        )}

        {unknownCards.length > 0 && (
          <div className="mt-10 space-y-4">
            {unknownCards.map((card) => (
              <div
                key={card.id}
                className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm"
              >
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {card.card_type}
                </p>
                <pre className="mt-2 text-xs text-slate-600 whitespace-pre-wrap">
                  {JSON.stringify(card.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}

        <footer className="mt-16 text-center text-xs text-slate-400">
          <p>
            Made with{" "}
            <Link href="/" className="text-pink-600 hover:underline">
              mycard.to
            </Link>{" "}
            · Free for every creator
          </p>
        </footer>
      </div>
    </main>
  );
}
