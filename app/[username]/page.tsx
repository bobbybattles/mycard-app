import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// Public kit page rendered at mycard.to/<username>.
// Server-rendered for speed + SEO. RLS keeps unpublished kits 404 to outsiders.
export default async function PublicKitPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name")
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

  return (
    <main className="flex-1 bg-gradient-to-b from-pink-50 to-white">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <header className="text-center">
          <div className="mx-auto h-24 w-24 rounded-full bg-pink-100 flex items-center justify-center text-3xl font-bold text-pink-600">
            {(profile.display_name || profile.username)[0]?.toUpperCase()}
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            {profile.display_name || `@${profile.username}`}
          </h1>
          <p className="mt-1 text-sm font-mono text-slate-500">
            mycard.to/{profile.username}
          </p>
        </header>

        <div className="mt-10 space-y-4">
          {(cards ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center text-slate-500">
              This kit is just getting started.
            </div>
          ) : (
            (cards ?? []).map((card) => (
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
            ))
          )}
        </div>

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
