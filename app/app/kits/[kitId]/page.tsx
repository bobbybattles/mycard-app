import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
import RatesCardEditor from "@/components/cards/rates-card-editor";
import type { RatesCardData } from "@/lib/rates";
import type { LinksCardData, ProfileLink } from "@/lib/links";
import KitSettingsEditor from "@/components/kits/kit-settings-editor";
import DesignPicker from "@/components/kits/design-picker";
import { getDesign } from "@/lib/themes";

export const dynamic = "force-dynamic";

// Edit a specific media kit. Replaces the old /app/dashboard.
// Each card editor remains the same; we just scope to the given kit's id.
export default async function EditKitPage({
  params,
}: {
  params: Promise<{ kitId: string }>;
}) {
  const { kitId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Look up the kit and confirm it belongs to this user (RLS will also enforce).
  const { data: kit } = await supabase
    .from("kits")
    .select("id, user_id, slug, name, theme")
    .eq("id", kitId)
    .maybeSingle();

  if (!kit || kit.user_id !== user.id) return notFound();

  // Load all editable cards for this kit in parallel.
  const [
    profileCardRes,
    metricsCardRes,
    portfolioCardRes,
    linksCardRes,
    ratesCardRes,
  ] = await Promise.all([
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
    supabase
      .from("cards")
      .select("id, data, is_visible")
      .eq("kit_id", kit.id)
      .eq("card_type", "rates")
      .maybeSingle(),
  ]);

  const profileCard = profileCardRes.data;
  const metricsCard = metricsCardRes.data;
  const portfolioCard = portfolioCardRes.data;
  const linksCard = linksCardRes.data;
  const ratesCard = ratesCardRes.data;

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
          <Link
            href="/app/kits"
            className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
          >
            ← Back to kits
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {kit.name || "Untitled kit"}
          </h1>
          {kit.slug ? (
            <p className="mt-1 text-slate-700">
              Live at{" "}
              <Link
                href={`/${kit.slug}`}
                target="_blank"
                className="font-mono text-pink-600 hover:underline"
              >
                mycard.to/{kit.slug}
              </Link>
            </p>
          ) : (
            <p className="mt-1 text-slate-500 text-sm italic">
              Set a URL slug below to make this kit shareable.
            </p>
          )}
        </div>

        <KitSettingsEditor
          kitId={kit.id}
          initialName={kit.name ?? ""}
          initialSlug={kit.slug ?? ""}
        />

        <DesignPicker
          kitId={kit.id}
          initialDesign={getDesign(kit.theme as Record<string, unknown> | null)}
          initialTheme={(kit.theme as Record<string, unknown>) ?? {}}
        />

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

        <RatesCardEditor
          kitId={kit.id}
          card={
            ratesCard
              ? {
                  id: ratesCard.id,
                  data: (ratesCard.data ?? { items: [] }) as RatesCardData,
                  is_visible: ratesCard.is_visible,
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

        <div className="flex items-center justify-between">
          <Link
            href="/app/kits"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← Back to kits
          </Link>
          {kit.slug && (
            <Link
              href={`/${kit.slug}`}
              target="_blank"
              className="inline-block rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              View this kit →
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
