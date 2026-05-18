// OAuth + email-confirmation callback handler.
// Exchanges the ?code=... query param Supabase appends for an auth session,
// then redirects to ?next= (defaulting to the dashboard).

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/app/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  // Fall through: show a soft error on the login page rather than a crash.
  return NextResponse.redirect(
    new URL(`/login?error=callback`, url.origin)
  );
}
