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

// Public kit page rendered at mycard.to/<username>.
// Server-rendered for speed + SEO. RLS keeps unpublished kits 404 to outsiders.
export const dynamic = "force-dynamic";

export default async function PublicKitPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (!profile) return notFound();

  const { data: kit } = await supabase
    .from("kits")
    .select("id, theme, is_published")
    .eq("user_id", profile.id)
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
  const knownTypes = new Set(["profile", "metrics", "portfolio"]);
  const unknownCards = (cards ?? []).filter((c) => !knownTypes.has(c.card_type));

  const profileData = (profileCard?.data ?? {}) as ProfileCardData;
  const metricsData = (metricsCard?.data ?? {}) as MetricsCardData;
  const portfolioData = (portfolioCard?.data ?? { groups: [] }) as PortfolioCardData;

  return (
    <main className="flex-1 bg-gradient-to-b from-pink-50 to-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <ProfileCard
          username={profile.username}
          data={(profileCard?.data ?? {}) as ProfileCardData}
        />

        {hasAnyMetric(metricsData) && (
          <div className="mt-12">
            <MetricsCard data={metricsData} />
          </div>
        )}

        {((portfolioData.groups && portfolioData.groups.length > 0) ||
          (portfolioData.videos && portfolioData.videos.length > 0)) && (
          <div className="mt-12">
            <PortfolioCard data={portfolioData} />
          </div>
        )}

        {((profileData.platform_links && profileData.platform_links.length > 0) ||
          (profileData.social_profiles && profileData.social_profiles.length > 0)) && (
          <div className="mt-14">
            <PlatformLinks
              links={profileData.platform_links ?? []}
              socials={profileData.social_profiles}
            />
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
