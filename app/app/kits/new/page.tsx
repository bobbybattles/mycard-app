import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewKitForm from "@/components/kits/new-kit-form";
import { checkProStatus, canCreateAnotherKit } from "@/lib/subscription";

export const dynamic = "force-dynamic";

// "Create a new media kit" page.
// Server side: enforce kit limit (1 for free, 10 for Pro) and load existing
// kits so the form can offer "Start from a copy of X" as an option.
export default async function NewKitPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: kits } = await supabase
    .from("kits")
    .select("id, slug, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  // Pull the user's saved Oink subscription email (if any) so we can verify
  // them as Pro using that instead of their signup email.
  const { data: profile } = await supabase
    .from("profiles")
    .select("oink_email")
    .eq("id", user.id)
    .single();
  const oinkEmail = (profile as { oink_email?: string | null } | null)?.oink_email ?? null;
  const effectiveEmail = oinkEmail || user.email || "";

  const existing = kits ?? [];
  const status = await checkProStatus(effectiveEmail);
  const canCreate = canCreateAnotherKit(existing.length, status);

  // Hit limit by URL? Show an upgrade screen instead of the form.
  if (!canCreate) {
    return (
      <main className="flex-1 px-6 py-10 bg-slate-50">
        <div className="mx-auto max-w-xl">
          <Link
            href="/app/kits"
            className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
          >
            ← Back to kits
          </Link>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              {status.isPro ? "Kit limit reached" : "Upgrade to add more kits"}
            </h1>
            <p className="mt-3 text-slate-700">
              {status.isPro
                ? `Your Oink Pro plan includes up to ${status.kitLimit} media kits, and you've used them all. Contact us to free up a slot.`
                : `The free plan includes 1 media kit. Upgrade to Oink Pro for up to ${status.kitLimit} kits, plus all the extension features.`}
            </p>
            {!status.isPro && (
              <a
                href="https://www.oinkforinfluencers.com/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block rounded-lg bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-700"
              >
                Upgrade to Oink Pro →
              </a>
            )}
            <div className="mt-4">
              <Link
                href="/app/kits"
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Back to your kits
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const options = existing.map((k) => ({
    id: k.id,
    label: k.name || k.slug || "Untitled kit",
  }));

  return (
    <main className="flex-1 px-6 py-10 bg-slate-50">
      <div className="mx-auto max-w-xl">
        <Link
          href="/app/kits"
          className="text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
        >
          ← Back to kits
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Create a new media kit
        </h1>
        <p className="mt-1 text-sm text-slate-700">
          Start from scratch or copy an existing kit and tweak it.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {status.isPro ? "Pro plan" : "Free plan"} ·{" "}
          {existing.length} of {status.kitLimit} kits used
        </p>

        <div className="mt-6">
          <NewKitForm existingKits={options} />
        </div>
      </div>
    </main>
  );
}
