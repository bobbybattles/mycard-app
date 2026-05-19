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
import type { LinksCardData, ProfileLink } from "@/lib/links";

// Public kit page rendered at mycard.to/<slug>.
// Each kit has its own slug — a user can have many kits, one URL per kit.
// Path param is named [username] for backward-compat with the original
// schema; here it's just the kit slug.
export const dynamic = "force-dynamic";

export default async function PublicKitPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const slug = username.toLowerCase();
  const supabase = await createClient();

  // Look up the kit by slug.
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
  const knownTypes = new Set(["profile", "metrics", "portfolio", "links"]);
  const unknownCards = (cards ?? []).filter((c) => !knownTypes.has(c.card_type));

  const profileData = (profileCard?.data ?? {}) as ProfileCardData;
  const metricsData = (metricsCard?.data ?? {}) as MetricsCardData;
  const portfolioData = (portfolioCard?.data ?? { groups: [] }) as PortfolioCardData;
  const linksData = (linksCard?.data ?? { links: [] }) as LinksCardData;

  // Resolve which link list to render: prefer the unified Links card; fall
  // back to the legacy fields on the profile card so existing kits keep
  // working until the user re-saves.
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

  return (
    <main className="flex-1 bg-gradient-to-b from-pink-50 to-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <ProfileCard
          username={kit.slug ?? slug}
          data={profileData}
        />

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
