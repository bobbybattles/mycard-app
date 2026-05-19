import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/auth/sign-out-button";

// Layout for the authenticated app section (/app/*).
// Middleware already redirects unauthenticated users away — this is just the
// chrome (header bar) shown around every authenticated page.
//
// With multi-kit, the "current kit URL" depends on which page you're on, so
// we drop the kit URL from the header and let each page show its own.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-slate-100 px-6 py-3 flex items-center justify-between">
        <Link
          href="/app/kits"
          className="font-bold text-lg tracking-tight text-pink-600"
        >
          mycard.to
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/app/kits"
            className="text-slate-600 hover:text-slate-900"
          >
            My kits
          </Link>
          <span className="text-slate-400">·</span>
          <span className="text-slate-600 hidden sm:inline">{user.email}</span>
          <SignOutButton />
        </div>
      </header>
      {children}
    </div>
  );
}
