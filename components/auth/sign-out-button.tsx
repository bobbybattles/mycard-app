"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Tiny client component that signs the user out and bounces them to /.
export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      className="text-slate-600 hover:text-slate-900"
    >
      Sign out
    </button>
  );
}
