import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileCardEditor, {
  type ProfileCardData,
} from "@/components/cards/profile-card-editor";
import MetricsCardEditor from "@/components/cards/metrics-card-editor";
import type { MetricsCardData } from "@/lib/metrics-schema";
import PortfolioCardEditor, {
  type PortfolioCardData,
} from "@/components/cards/portfolio-card-editor";
import ConnectionsCardEditor from "@/components/cards/connections-card-editor";
import type { LinksCardData, ProfileLink } from "@/lib/links";

// Always re-fetch on every request so a save followed by a refresh shows the
// freshly persisted data, not a stale cached render.
export const dynamic = "force-dynamic";

// Main dashboard.
// If the user hasn't picked a username yet, send them to onboarding first.
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (!profile?.username) redirect("/app/onboarding");

  const { data: kit } = await supabase
    .from("kits")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!kit) {
    return (
      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold text-slate-900">
            Hmm, your kit isn&apos;t set up.
          </h1>
          <p className="mt-2 text-slate-700">
            Refresh the page or sign out and back in. If this keeps happening,
            reach out to support.
          </p>
        </div>
      </main>
    );
  }

  // Load all editable cards in parallel.
  const [profileCardRes, metricsCardRes, portfolioCardRes, linksCardRes] =
    await Promise.all([
      supabase
        .from("cards")
        .select("id, data, is_visible")
        .eq("kit_id", kit.id)
        .eq("card_type", "profile")
        .maybeSingle(),
      supabase
        .from("cards")
        .select("id, data, is_visible")
        .eq("kit_id", kit.id)
        .eq("card_type", "metrics")
        .maybeSingle(),
      supabase
        .from("cards")
        .select("id, data, is_visible")
        .eq("kit_id", kit.id)
        .eq("card_type", "portfolio")
        .maybeSingle(),
      supabase
        .from("cards")
        .select("id, data, is_visible")
        .eq("kit_id", kit.id)
        .eq("card_type", "links")
        .maybeSingle(),
    ]);

  const profileCard = profileCardRes.data;
  const metricsCard = metricsCardRes.data;
  const portfolioCard = portfolioCardRes.data;
  const linksCard = linksCardRes.data;

  // Migrate legacy data: if no links card yet, seed from the profile card's
  // old platform_links + social_profiles fields.
  const profileData = (profileCard?.data ?? {}) as ProfileCardData;
  const legacyLinks: ProfileLink[] = [
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
    <main className="flex-1 px-6 py-10 bg-slate-50">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your media kit</h1>
          <p className="mt-1 text-slate-700">
            Live at{" "}
            <Link
              href={`/${profile.username}`}
              target="_blank"
              className="font-mono text-pink-600 hover:underline"
            >
              mycard.to/{profile.username}
            </Link>
          </p>
        </div>

        <ProfileCardEditor
          userId={user.id}
          kitId={kit.id}
          card={
            profileCard
              ? {
                  id: profileCard.id,
                  data: profileData,
                  is_visible: profileCard.is_visible,
                }
              : null
          }
        />

        <MetricsCardEditor
          kitId={kit.id}
          card={
            metricsCard
              ? {
                  id: metricsCard.id,
                  data: (metricsCard.data ?? {}) as MetricsCardData,
                  is_visible: metricsCard.is_visible,
                }
              : null
          }
        />

        <PortfolioCardEditor
          kitId={kit.id}
          card={
            portfolioCard
              ? {
                  id: portfolioCard.id,
                  data: (portfolioCard.data ?? { videos: [] }) as PortfolioCardData,
                  is_visible: portfolioCard.is_visible,
                }
              : null
          }
        />

        <ConnectionsCardEditor
          kitId={kit.id}
          card={
            linksCard
              ? {
                  id: linksCard.id,
                  data: (linksCard.data ?? { links: [] }) as LinksCardData,
                  is_visible: linksCard.is_visible,
                }
              : null
          }
          legacySeed={legacyLinks}
        />

        <div className="text-center">
          <Link
            href={`/${profile.username}`}
            target="_blank"
            className="inline-block rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            View my public kit →
          </Link>
        </div>
      </div>
    </main>
  );
}
