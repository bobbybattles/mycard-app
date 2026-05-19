import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewKitForm from "@/components/kits/new-kit-form";

export const dynamic = "force-dynamic";

// "Create a new media kit" page.
// Server side: load the list of existing kits so the form can offer
// "Start from a copy of X" as an option.
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

  const options = (kits ?? []).map((k) => ({
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

        <div className="mt-6">
          <NewKitForm existingKits={options} />
        </div>
      </div>
    </main>
  );
}
