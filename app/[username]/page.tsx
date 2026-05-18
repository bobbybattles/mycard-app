import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileCard from "@/components/cards/profile-card";
import type { ProfileCardData } from "@/components/cards/profile-card-editor";

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
  const otherCards = (cards ?? []).filter((c) => c.card_type !== "profile");

  return (
    <main className="flex-1 bg-gradient-to-b from-pink-50 to-white">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <ProfileCard
          username={profile.username}
          data={(profileCard?.data ?? {}) as ProfileCardData}
        />

        {otherCards.length > 0 && (
          <div className="mt-10 space-y-4">
            {otherCards.map((card) => (
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
