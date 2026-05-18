import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UsernamePicker from "@/components/onboarding/username-picker";

// First-run onboarding — user picks a username that becomes mycard.to/<name>.
// If they already have one, bounce straight to dashboard.
export default async function OnboardingPage() {
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

  if (profile?.username) redirect("/app/dashboard");

  // Suggest a sensible default from the email local-part.
  const suggested = (user.email ?? "")
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 30);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center">Pick your handle</h1>
        <p className="mt-2 text-center text-slate-600 text-sm">
          This becomes your public kit URL. You can change it later.
        </p>
        <div className="mt-8">
          <UsernamePicker initialSuggestion={suggested} />
        </div>
      </div>
    </main>
  );
}
