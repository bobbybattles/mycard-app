"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  PLATFORM_GROUPS,
  TIMEFRAME_OPTIONS,
  getSectionMetrics,
  normalizeMetrics,
  type MetricsCardData,
  type PlatformGroupConfig,
  type PlatformGroupData,
} from "@/lib/metrics-schema";

type Props = {
  kitId: string;
  card: { id: string; data: MetricsCardData; is_visible: boolean } | null;
};

// State helpers
type GroupValues = {
  timeframePreset: string;
  timeframeCustom: string;
  /** sectionId -> metricKey -> value */
  sections: Record<string, Record<string, string>>;
};

function splitTimeframe(saved: string | undefined) {
  if (!saved) return { preset: "", custom: "" };
  if (TIMEFRAME_OPTIONS.includes(saved)) return { preset: saved, custom: "" };
  return { preset: "__custom__", custom: saved };
}

function initGroupValues(
  groupData: PlatformGroupData | undefined,
  group: PlatformGroupConfig
): GroupValues {
  const tf = splitTimeframe(groupData?.timeframe);
  const sections: Record<string, Record<string, string>> = {};
  for (const section of group.sections) {
    sections[section.id] = {};
    const saved = getSectionMetrics(groupData, section.id);
    for (const metric of section.metrics) {
      sections[section.id][metric.key] = saved?.[metric.key] ?? "";
    }
  }
  return {
    timeframePreset: tf.preset,
    timeframeCustom: tf.custom,
    sections,
  };
}

function cleanedGroupData(values: GroupValues, group: PlatformGroupConfig): PlatformGroupData {
  const out: PlatformGroupData = {};
  const timeframe =
    values.timeframePreset === "__custom__"
      ? values.timeframeCustom.trim()
      : values.timeframePreset;
  if (timeframe) out.timeframe = timeframe;
  for (const section of group.sections) {
    const cleaned: Record<string, string> = {};
    for (const metric of section.metrics) {
      const v = values.sections[section.id]?.[metric.key]?.trim();
      if (v) cleaned[metric.key] = v;
    }
    if (Object.keys(cleaned).length > 0) {
      (out as Record<string, unknown>)[section.id] = cleaned;
    }
  }
  return out;
}

// Editor for the Metrics card. Two platform groups: Amazon and TikTok Shop.
// Each group has its own timeframe and one or more collapsible sections.
export default function MetricsCardEditor({ kitId, card }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const normalized = useMemo(() => normalizeMetrics(card?.data), [card?.data]);

  // One GroupValues entry per platform group.
  const [groups, setGroups] = useState<Record<string, GroupValues>>(() => {
    const out: Record<string, GroupValues> = {};
    for (const group of PLATFORM_GROUPS) {
      out[group.id] = initGroupValues(normalized[group.id], group);
    }
    return out;
  });

  const [openSection, setOpenSection] = useState<string | null>(
    PLATFORM_GROUPS[0]?.sections[0]?.id ?? null
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const t = setTimeout(() => setSaveStatus("idle"), 2500);
    return () => clearTimeout(t);
  }, [saveStatus]);

  function patchGroup(groupId: string, patch: Partial<GroupValues>) {
    setGroups((prev) => ({ ...prev, [groupId]: { ...prev[groupId], ...patch } }));
  }

  function setMetric(groupId: string, sectionId: string, key: string, value: string) {
    setGroups((prev) => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        sections: {
          ...prev[groupId].sections,
          [sectionId]: {
            ...prev[groupId].sections[sectionId],
            [key]: value,
          },
        },
      },
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaveStatus("idle");

    const data: MetricsCardData = {};
    for (const group of PLATFORM_GROUPS) {
      const cleaned = cleanedGroupData(groups[group.id], group);
      if (
        cleaned.timeframe ||
        Object.keys(cleaned).some((k) => k !== "timeframe")
      ) {
        data[group.id] = cleaned;
      }
    }

    startSave(async () => {
      const { error } = await supabase.from("cards").upsert(
        {
          kit_id: kitId,
          card_type: "metrics",
          position: 10,
          is_visible: true,
          data,
        },
        { onConflict: "kit_id,card_type" }
      );
      if (error) {
        setSaveStatus("error");
        setSaveError(error.message);
        return;
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
            Two platforms, each with its own timeframe. Leave a field blank to
            hide it on your public kit.
          </p>
        </div>
        {saveStatus === "saved" && (
          <span className="text-sm rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1">
            Saved ✓
          </span>
        )}
      </div>

      <div className="mt-5 space-y-6">
        {PLATFORM_GROUPS.map((group) => {
          const values = groups[group.id];
          return (
            <div
              key={group.id}
              className="rounded-xl border-2 border-slate-200 overflow-hidden"
            >
              <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-slate-900">
                  {group.label}
                </h3>
              </div>

              <div className="p-4 space-y-3">
                {/* Per-group timeframe */}
                <div className="rounded-lg border border-pink-100 bg-pink-50/50 px-4 py-3">
                  <label className="block">
                    <span className="block text-sm font-semibold text-slate-900">
                      Time frame for {group.label}
                    </span>
                    <span className="block text-xs text-slate-600 mt-0.5">
                      Shown alongside this section&apos;s stats on the public kit.
                    </span>
                    <select
                      value={values.timeframePreset}
                      onChange={(e) =>
                        patchGroup(group.id, { timeframePreset: e.target.value })
                      }
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
                    {values.timeframePreset === "__custom__" && (
                      <input
                        type="text"
                        value={values.timeframeCustom}
                        onChange={(e) =>
                          patchGroup(group.id, {
                            timeframeCustom: e.target.value,
                          })
                        }
                        placeholder="e.g. Q4 2025, Jan – Mar 2026"
                        maxLength={60}
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    )}
                  </label>
                </div>

                {/* Sections inside this platform group */}
                {group.sections.map((section) => {
                  const sectionKey = `${group.id}:${section.id}`;
                  const isOpen = openSection === sectionKey;
                  const filledCount = section.metrics.filter(
                    (m) => values.sections[section.id]?.[m.key]?.trim()
                  ).length;
                  return (
                    <div
                      key={section.id}
                      className="rounded-lg border border-slate-200 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenSection(isOpen ? null : sectionKey)
                        }
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left transition"
                      >
                        <span className="font-semibold text-slate-900">
                          {section.title}
                        </span>
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
                                value={values.sections[section.id]?.[metric.key] ?? ""}
                                onChange={(e) =>
                                  setMetric(
                                    group.id,
                                    section.id,
                                    metric.key,
                                    e.target.value
                                  )
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
