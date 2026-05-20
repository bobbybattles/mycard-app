import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkProStatus, canCreateAnotherKit } from "@/lib/subscription";
import type { Kit } from "@/lib/kits";

export const dynamic = "force-dynamic";

// List of all the signed-in user's media kits.
// Click one to edit, or "+ New kit" to create another (blank or duplicated).
// Free plan = 1 kit max, Pro plan (from Oink subscription) = 10 kits max.
export default async function KitsListPage() {
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

  const { data: kits } = await supabase
    .from("kits")
    .select("id, slug, name, is_published, updated_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const kitList = (kits ?? []) as Pick<Kit, "id" | "slug" | "name" | "is_published" | "updated_at" | "created_at">[];

  // Pro check — gates kit creation. Failure modes default to free (kitLimit=1).
  const status = await checkProStatus(user.email);
  const canCreate = canCreateAnotherKit(kitList.length, status);

  return (
    <main className="flex-1 px-6 py-10 bg-slate-50">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your media kits</h1>
            <p className="mt-1 text-slate-700 text-sm">
              Build different kits for different brands — each gets its own
              URL.
            </p>
          </div>
          {canCreate ? (
            <Link
              href="/app/kits/new"
              className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 transition"
            >
              + New kit
            </Link>
          ) : (
            <span
              title={
                status.isPro
                  ? `Pro plan: ${status.kitLimit} kits max`
                  : "Free plan: 1 kit. Upgrade to Oink Pro for up to 10."
              }
              className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 cursor-not-allowed"
            >
              + New kit
            </span>
          )}
        </div>

        {/* Plan / usage banner */}
        <div
          className={`mb-5 rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-3 ${
            status.isPro
              ? "border-pink-200 bg-pink-50 text-pink-900"
              : "border-slate-200 bg-white text-slate-700"
          }`}
        >
          <div>
            <span className="font-semibold">
              {status.isPro ? "Oink Pro" : "Free plan"}
            </span>
            <span className="ml-2 text-slate-600">
              {kitList.length} of {status.kitLimit} kits used
            </span>
          </div>
          {!status.isPro && (
            <a
              href="https://www.oinkforinfluencers.com/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pink-700"
            >
              Upgrade to Pro for 10 kits →
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kitList.map((kit) => (
            <div
              key={kit.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col"
            >
              <h2 className="text-base font-semibold text-slate-900">
                {kit.name || "Untitled kit"}
              </h2>
              {kit.slug ? (
                <a
                  href={`/${kit.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-sm font-mono text-pink-600 hover:underline truncate"
                >
                  mycard.to/{kit.slug}
                </a>
              ) : (
                <p className="mt-1 text-sm text-slate-500 italic">No URL set</p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Updated {formatRelative(kit.updated_at)}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Link
                  href={`/app/kits/${kit.id}`}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Edit
                </Link>
                {kit.slug && (
                  <a
                    href={`/${kit.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View →
                  </a>
                )}
              </div>
            </div>
          ))}

          {canCreate ? (
            <Link
              href="/app/kits/new"
              className="rounded-xl border-2 border-dashed border-slate-300 p-5 flex flex-col items-center justify-center text-slate-500 hover:border-pink-400 hover:text-pink-700 hover:bg-pink-50 transition min-h-[180px]"
            >
              <span className="text-3xl mb-1" aria-hidden>
                +
              </span>
              <span className="text-sm font-semibold">New kit</span>
            </Link>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-5 flex flex-col items-center justify-center text-center min-h-[180px]">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">
                Limit reached
              </span>
              {status.isPro ? (
                <p className="text-sm text-slate-500">
                  You&apos;ve used all {status.kitLimit} of your Pro kit slots.
                </p>
              ) : (
                <>
                  <p className="text-sm text-slate-600 mb-3">
                    Free plan includes 1 kit. Upgrade to Oink Pro for up to 10.
                  </p>
                  <a
                    href="https://www.oinkforinfluencers.com/pricing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pink-700"
                  >
                    Upgrade to Pro →
                  </a>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
