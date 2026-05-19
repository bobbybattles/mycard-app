"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DESIGNS, DESIGN_ORDER, type DesignId } from "@/lib/themes";

type Props = {
  kitId: string;
  initialDesign: DesignId;
  /** Current theme object — we merge design onto it so other theme keys persist. */
  initialTheme: Record<string, unknown>;
};

// Visual design picker. Saves to kits.theme.design.
export default function DesignPicker({
  kitId,
  initialDesign,
  initialTheme,
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [selected, setSelected] = useState<DesignId>(initialDesign);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const t = setTimeout(() => setSaveStatus("idle"), 2500);
    return () => clearTimeout(t);
  }, [saveStatus]);

  function handlePick(design: DesignId) {
    if (design === selected) return;
    setSelected(design);
    setSaveError(null);
    startSave(async () => {
      const nextTheme = { ...initialTheme, design };
      const { error } = await supabase
        .from("kits")
        .update({ theme: nextTheme })
        .eq("id", kitId);
      if (error) {
        setSaveStatus("error");
        setSaveError(error.message);
        // Revert UI selection so it matches what's actually saved.
        setSelected(initialDesign);
        return;
      }
      setSaveStatus("saved");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-semibold text-lg text-slate-900">Design</h2>
          <p className="text-sm text-slate-600">
            Pick the look + layout of this kit&apos;s public page. Each design
            uses the same elements arranged in a different style.
          </p>
        </div>
        {saveStatus === "saved" && (
          <span className="text-sm rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1">
            Saved ✓
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {DESIGN_ORDER.map((id) => {
          const cfg = DESIGNS[id];
          const isSelected = selected === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handlePick(id)}
              disabled={saving}
              aria-pressed={isSelected}
              className={`rounded-xl border-2 overflow-hidden text-left transition disabled:opacity-50 disabled:cursor-not-allowed ${
                isSelected
                  ? "border-pink-500 ring-2 ring-pink-200"
                  : "border-slate-200 hover:border-slate-400"
              }`}
            >
              <div
                className="aspect-[3/4] relative"
                style={{ background: cfg.previewBg }}
              >
                {/* Tiny mock content inside the preview */}
                <div className="absolute inset-3 flex flex-col gap-1.5">
                  <div
                    className="h-7 w-7 rounded-full shadow"
                    style={{ background: cfg.previewAccent, opacity: 0.85 }}
                  />
                  <div className="h-2 w-3/4 rounded-full bg-current opacity-30" />
                  <div className="h-1.5 w-1/2 rounded-full bg-current opacity-20" />
                  <div className="mt-auto grid grid-cols-2 gap-1">
                    <div className="h-3 rounded bg-current opacity-15" />
                    <div className="h-3 rounded bg-current opacity-15" />
                    <div className="h-3 rounded bg-current opacity-15" />
                    <div className="h-3 rounded bg-current opacity-15" />
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-pink-600 text-white text-[10px] font-bold flex items-center justify-center shadow">
                    ✓
                  </div>
                )}
              </div>
              <div className="px-3 py-2 bg-white">
                <p className="text-xs font-semibold text-slate-900">{cfg.name}</p>
                <p className="text-[10px] text-slate-500 leading-tight">
                  {cfg.tagline}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {saveError && (
        <p className="mt-3 text-sm text-red-600">{saveError}</p>
      )}
    </div>
  );
}
