// Subscription gating for mycard.to.
//
// Pro status comes from Fizz's existing Render endpoint (the same one the Oink
// extension hits): https://check-subscription.onrender.com/check
// POST { email } → { isPro: true|false, ... }
//
// We cache the result in-memory per server instance to avoid hammering Render
// (which has slow cold starts on the free/starter tier). Cache TTL is 10
// minutes, which is plenty fresh for limit enforcement.

const SUB_ENDPOINT = "https://check-subscription.onrender.com/check";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

type CacheEntry = { isPro: boolean; ts: number };

// Module-level cache. In a single-region serverless setup this is per-instance,
// which is fine — worst case a Pro upgrade takes up to 10 minutes to reflect.
const cache = new Map<string, CacheEntry>();

/** Free plan kit limit. */
export const FREE_KIT_LIMIT = 1;
/** Pro plan kit limit. */
export const PRO_KIT_LIMIT = 10;

export type ProStatus = {
  isPro: boolean;
  kitLimit: number;
};

/**
 * Check whether the email's account is a Pro subscriber.
 * Defaults to `false` if the endpoint is down so we don't block the entire
 * product when Render is having a bad day.
 */
export async function checkProStatus(email: string | null | undefined): Promise<ProStatus> {
  const normalized = (email ?? "").trim().toLowerCase();
  if (!normalized) return { isPro: false, kitLimit: FREE_KIT_LIMIT };

  // Cache hit?
  const cached = cache.get(normalized);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return {
      isPro: cached.isPro,
      kitLimit: cached.isPro ? PRO_KIT_LIMIT : FREE_KIT_LIMIT,
    };
  }

  // Hit Render endpoint. 15s timeout — cold starts can be slow but we don't
  // want to hang the page forever.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(SUB_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalized }),
      signal: controller.signal,
      // Next.js: don't cache this fetch at the framework level either
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      // Endpoint up but error — treat as free for now, don't cache the error
      return { isPro: false, kitLimit: FREE_KIT_LIMIT };
    }

    const json = (await res.json()) as { isPro?: boolean };
    const isPro = json.isPro === true;
    cache.set(normalized, { isPro, ts: Date.now() });
    return { isPro, kitLimit: isPro ? PRO_KIT_LIMIT : FREE_KIT_LIMIT };
  } catch {
    clearTimeout(timeoutId);
    // Network error / timeout — fail soft (treat as free, don't cache)
    return { isPro: false, kitLimit: FREE_KIT_LIMIT };
  }
}

/** True if the user can still create another kit. */
export function canCreateAnotherKit(currentCount: number, status: ProStatus): boolean {
  return currentCount < status.kitLimit;
}
