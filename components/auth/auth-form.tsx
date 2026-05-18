"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";

// Shared auth form used by /login and /signup.
// Renders Google sign-in button + an email/password fallback.
export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = search.get("redirect") || "/app/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"google" | "email" | null>(null);
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null);

  const supabase = createClient();

  async function handleGoogle() {
    setMessage(null);
    setLoading("google");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) {
      setLoading(null);
      setMessage({ kind: "error", text: error.message });
    }
    // On success the browser navigates to Google; nothing else to do here.
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading("email");

    if (mode === "sign-up") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });
      setLoading(null);
      if (error) {
        setMessage({ kind: "error", text: error.message });
        return;
      }
      setMessage({
        kind: "info",
        text: "Check your email — we sent a confirmation link.",
      });
      return;
    }

    // sign-in
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(null);
    if (error) {
      setMessage({ kind: "error", text: error.message });
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading !== null}
        className="w-full inline-flex items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <GoogleIcon />
        {loading === "google"
          ? "Redirecting…"
          : mode === "sign-up"
            ? "Continue with Google"
            : "Sign in with Google"}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-500 uppercase tracking-wide">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={handleEmail} className="space-y-3">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        <input
          type="password"
          required
          minLength={8}
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        <button
          type="submit"
          disabled={loading !== null}
          className="w-full rounded-lg bg-pink-600 px-4 py-3 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading === "email"
            ? mode === "sign-up"
              ? "Creating account…"
              : "Signing in…"
            : mode === "sign-up"
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      {message && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            message.kind === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.96h5.52c-.24 1.44-1.68 4.2-5.52 4.2-3.36 0-6.06-2.76-6.06-6.12s2.7-6.12 6.06-6.12c1.92 0 3.18.78 3.9 1.5l2.64-2.52C16.86 3.6 14.7 2.7 12 2.7 6.84 2.7 2.7 6.84 2.7 12s4.14 9.3 9.3 9.3c5.4 0 8.94-3.78 8.94-9.06 0-.6-.06-1.08-.18-1.5H12z"
      />
    </svg>
  );
}
