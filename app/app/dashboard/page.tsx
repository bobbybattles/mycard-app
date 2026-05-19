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
  const [profileCardRes, metricsCardRes, portfolioCardRes] = await Promise.all([
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
  ]);

  const profileCard = profileCardRes.data;
  const metricsCard = metricsCardRes.data;
  const portfolioCard = portfolioCardRes.data;

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
                  data: (profileCard.data ?? {}) as ProfileCardData,
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

        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
          <p className="text-slate-500 text-sm">
            More cards coming next: socials, brand collabs, rate card, and contact.
          </p>
        </div>

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
