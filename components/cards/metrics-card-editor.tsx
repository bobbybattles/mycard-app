"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  METRIC_SECTIONS,
  TIMEFRAME_OPTIONS,
  type MetricsCardData,
  type MetricSection,
} from "@/lib/metrics-schema";

// Decide what to put in the timeframe <select>. If the saved value isn't one
// of the preset options, treat it as "Custom" so the input is editable.
function splitTimeframe(saved: string | undefined) {
  if (!saved) return { preset: "", custom: "" };
  if (TIMEFRAME_OPTIONS.includes(saved)) return { preset: saved, custom: "" };
  return { preset: "__custom__", custom: saved };
}

type Props = {
  kitId: string;
  card: { id: string; data: MetricsCardData; is_visible: boolean } | null;
};

// Initialize editor state from saved card data (or empty strings everywhere).
function initialValues(data: MetricsCardData | undefined): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  for (const section of METRIC_SECTIONS) {
    out[section.id] = {};
    for (const metric of section.metrics) {
      out[section.id][metric.key] = data?.[section.id]?.[metric.key] ?? "";
    }
  }
  return out;
}

// Editor for the Metrics card.
// Saves to cards table on card_type = "metrics" for this kit.
// Empty values are simply not stored, which hides them on the public kit.
export default function MetricsCardEditor({ kitId, card }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [values, setValues] = useState(() => initialValues(card?.data));
  const initialTimeframe = splitTimeframe(card?.data?.timeframe);
  const [timeframePreset, setTimeframePreset] = useState<string>(
    initialTimeframe.preset
  );
  const [timeframeCustom, setTimeframeCustom] = useState<string>(
    initialTimeframe.custom
  );
  const [openSection, setOpenSection] = useState<MetricSection["id"] | null>(
    "offsite"
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  // Resolve the timeframe string to persist (preset name OR the custom text).
  const resolvedTimeframe =
    timeframePreset === "__custom__"
      ? timeframeCustom.trim()
      : timeframePreset;

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const t = setTimeout(() => setSaveStatus("idle"), 2500);
    return () => clearTimeout(t);
  }, [saveStatus]);

  function setMetric(sectionId: string, key: string, value: string) {
    setValues((prev) => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], [key]: value },
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaveStatus("idle");

    // Build the persisted data, dropping any empty strings so the row stays tidy.
    const data: MetricsCardData = {};
    if (resolvedTimeframe) data.timeframe = resolvedTimeframe;
    for (const section of METRIC_SECTIONS) {
      const cleaned: Record<string, string> = {};
      for (const metric of section.metrics) {
        const v = values[section.id]?.[metric.key]?.trim();
        if (v) cleaned[metric.key] = v;
      }
      if (Object.keys(cleaned).length > 0) {
        (data as Record<string, Record<string, string>>)[section.id] = cleaned;
      }
    }

    startSave(async () => {
      if (card) {
        const { error } = await supabase
          .from("cards")
          .update({ data, is_visible: true })
          .eq("id", card.id);
        if (error) {
          setSaveStatus("error");
          setSaveError(error.message);
          return;
        }
      } else {
        const { error } = await supabase.from("cards").insert({
          kit_id: kitId,
          card_type: "metrics",
          position: 10, // Render below the profile card by default.
          is_visible: true,
          data,
        });
        if (error) {
          setSaveStatus("error");
          setSaveError(error.message);
          return;
        }
      }
      setSaveStatus("saved");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <h2 className="font-semibold text-lg text-slate-900">Metrics</h2>
          <p className="text-sm text-slate-600">
            Pick what to show. Leave a field blank to hide it.
          </p>
        </div>
        {saveStatus === "saved" && (
          <span className="text-sm rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1">
            Saved ✓
          </span>
        )}
      </div>

      <div className="mt-5 rounded-lg border border-pink-100 bg-pink-50/50 px-4 py-3">
        <label className="block">
          <span className="block text-sm font-semibold text-slate-900">
            Time frame these numbers cover
          </span>
          <span className="block text-xs text-slate-600 mt-0.5">
            Shown at the top of the metrics section on your public kit so
            brands know what window they&apos;re looking at.
          </span>
          <select
            value={timeframePreset}
            onChange={(e) => setTimeframePreset(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">Pick a timeframe…</option>
            {TIMEFRAME_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
            <option value="__custom__">Custom…</option>
          </select>
          {timeframePreset === "__custom__" && (
            <input
              type="text"
              value={timeframeCustom}
              onChange={(e) => setTimeframeCustom(e.target.value)}
              placeholder="e.g. Q4 2025, Jan – Mar 2026"
              maxLength={60}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          )}
        </label>
      </div>

      <div className="mt-4 space-y-3">
        {METRIC_SECTIONS.map((section) => {
          const isOpen = openSection === section.id;
          const filledCount = section.metrics.filter(
            (m) => values[section.id]?.[m.key]?.trim()
          ).length;
          return (
            <div
              key={section.id}
              className="rounded-lg border border-slate-200 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenSection(isOpen ? null : section.id)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left transition"
              >
                <span className="font-semibold text-slate-900">{section.title}</span>
                <span className="text-xs text-slate-600">
                  {filledCount > 0 && (
                    <span className="mr-3 rounded-full bg-pink-100 text-pink-700 px-2 py-0.5 font-medium">
                      {filledCount} filled
                    </span>
                  )}
                  <span aria-hidden>{isOpen ? "▾" : "▸"}</span>
                </span>
              </button>

              {isOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4 py-4 bg-white">
                  {section.metrics.map((metric) => (
                    <label key={metric.key} className="block">
                      <span className="block text-sm font-medium text-slate-800">
                        {metric.label}
                      </span>
                      {metric.hint && (
                        <span className="block text-xs text-slate-500 mb-1">
                          {metric.hint}
                        </span>
                      )}
                      <input
                        type="text"
                        value={values[section.id]?.[metric.key] ?? ""}
                        onChange={(e) =>
                          setMetric(section.id, metric.key, e.target.value)
                        }
                        placeholder={metric.placeholder}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        {saveError && (
          <span className="text-sm text-red-600 mr-auto">{saveError}</span>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-pink-600 px-5 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {saving ? "Saving…" : "Save metrics"}
        </button>
      </div>
    </form>
  );
}
