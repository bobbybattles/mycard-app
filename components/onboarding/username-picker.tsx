"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const USERNAME_RE = /^[a-z0-9_-]{3,30}$/;

// Reserved values that match the DB-side check constraint in 0001_initial_schema.sql.
const RESERVED = new Set([
  "admin", "api", "app", "auth", "callback", "login", "signup",
  "signin", "logout", "logoff", "reset", "dashboard", "settings",
  "help", "about", "contact", "pricing", "terms", "privacy", "tos",
  "support", "docs", "blog", "home", "index", "www", "mail",
  "media", "mediakit", "kit", "kits", "profile", "profiles",
  "user", "users", "oink", "mycard", "card", "cards", "static",
  "public", "assets", "images", "img", "css", "js",
]);

type Availability =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "invalid"; reason: string }
  | { state: "taken" }
  | { state: "available" };

// Username picker — checks availability live and saves on submit.
export default function UsernamePicker({
  initialSuggestion,
}: {
  initialSuggestion: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [value, setValue] = useState(initialSuggestion);
  const [availability, setAvailability] = useState<Availability>({ state: "idle" });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  // Debounced availability check.
  useEffect(() => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
      setAvailability({ state: "idle" });
      return;
    }
    if (!USERNAME_RE.test(trimmed)) {
      setAvailability({
        state: "invalid",
        reason: "3–30 chars, lowercase letters, numbers, _ or -",
      });
      return;
    }
    if (RESERVED.has(trimmed)) {
      setAvailability({ state: "invalid", reason: "That handle is reserved." });
      return;
    }

    setAvailability({ state: "checking" });
    const handle = setTimeout(async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", trimmed)
        .maybeSingle();
      if (error) {
        setAvailability({ state: "invalid", reason: error.message });
        return;
      }
      setAvailability({ state: data ? "taken" : "available" });
    }, 350);
    return () => clearTimeout(handle);
  }, [value, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (availability.state !== "available") return;
    const trimmed = value.trim().toLowerCase();

    startSubmit(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSubmitError("You're not signed in anymore — try signing in again.");
        return;
      }
      const { error } = await supabase
        .from("profiles")
        .update({ username: trimmed })
        .eq("id", user.id);
      if (error) {
        // Most likely cause: race on uniqueness, or the DB-side check constraint.
        setSubmitError(
          error.code === "23505"
            ? "Someone just took that one. Try another."
            : error.message
        );
        return;
      }
      router.push("/app/dashboard");
      router.refresh();
    });
  }

  const canSubmit = availability.state === "available" && !submitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="flex items-stretch rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-pink-500 overflow-hidden">
          <span className="px-3 inline-flex items-center bg-slate-50 text-slate-500 text-sm font-mono border-r border-slate-300">
            mycard.to/
          </span>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value.toLowerCase())}
            placeholder="yourname"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="flex-1 min-w-0 px-3 py-2.5 text-sm focus:outline-none font-mono"
          />
        </div>
        <div className="mt-2 min-h-5 text-sm">
          {availability.state === "checking" && (
            <span className="text-slate-500">Checking availability…</span>
          )}
          {availability.state === "invalid" && (
            <span className="text-red-600">{availability.reason}</span>
          )}
          {availability.state === "taken" && (
            <span className="text-red-600">That handle is already taken.</span>
          )}
          {availability.state === "available" && (
            <span className="text-emerald-600">Available!</span>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-pink-600 px-4 py-3 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {submitting ? "Saving…" : "Claim my handle"}
      </button>

      {submitError && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          {submitError}
        </div>
      )}
    </form>
  );
}
