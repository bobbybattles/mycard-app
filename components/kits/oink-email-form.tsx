"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  userId: string;
  /** The email currently saved on the profile (oink_email column). */
  initialOinkEmail: string;
  /** The user's auth/signup email — used as the placeholder + fallback hint. */
  signupEmail: string;
  /** Whether the current effective email is verified as Pro. */
  isPro: boolean;
};

// Lets the user enter the email tied to their Oink Pro subscription, which
// may differ from the email they used to sign up for mycard.to. Saving
// triggers a page refresh so the kit-limit and Pro banner re-check.
export default function OinkEmailForm({
  userId,
  initialOinkEmail,
  signupEmail,
  isPro,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState(initialOinkEmail);
  const [saving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const effectiveEmail = email.trim() || signupEmail;
  const dirty = email.trim() !== initialOinkEmail.trim();

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleaned = email.trim().toLowerCase();

    startSave(async () => {
      const supabase = createClient();
      const { error: err } = await supabase
        .from("profiles")
        .update({ oink_email: cleaned || null })
        .eq("id", userId);
      if (err) {
        setError(err.message);
        return;
      }
      // Refresh so the subscription check re-runs with the new email.
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSave}
      className="mb-5 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <label
            htmlFor="oink-email"
            className="block text-sm font-semibold text-slate-900"
          >
            Oink subscription email
          </label>
          <p className="text-xs text-slate-600 mt-0.5">
            If your Oink Pro account uses a different email than the one you
            signed up here with, enter it below so we can match it up. Leave
            blank to use your signup email ({signupEmail}).
          </p>
        </div>
        <span
          className={`shrink-0 text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-1 ${
            isPro
              ? "bg-pink-100 text-pink-800 border border-pink-200"
              : "bg-amber-100 text-amber-800 border border-amber-200"
          }`}
        >
          {isPro ? "Pro verified" : "Not a subscriber"}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-2">
        <input
          id="oink-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={signupEmail}
          maxLength={200}
          autoComplete="off"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        <button
          type="submit"
          disabled={saving || !dirty}
          className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {saving ? "Checking…" : "Save & verify"}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}

      <p className="mt-2 text-[11px] text-slate-500">
        Checking with: <span className="font-mono">{effectiveEmail}</span>
      </p>
    </form>
  );
}
