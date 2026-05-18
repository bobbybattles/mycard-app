import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold">Your media kit</h1>
        <p className="mt-1 text-slate-600">
          Live at{" "}
          <a
            href={`/${profile.username}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-pink-600 hover:underline"
          >
            mycard.to/{profile.username}
          </a>
        </p>

        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <p className="text-slate-600">
            Card editor is coming next. For now your kit shows your handle and a
            placeholder profile card. Phase 1 of the build.
          </p>
          <Link
            href={`/${profile.username}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700"
          >
            View my kit
          </Link>
        </div>
      </div>
    </main>
  );
}
