// Browser-side Supabase client.
// Use this in Client Components (anything with "use client") for auth + DB queries.
// Only the publishable key is sent to the browser — never the service-role secret.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
