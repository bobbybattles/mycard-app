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

// Visual design picker. Shows current design + a "Pick kit layout" button.
// Button opens a modal with all 5 design previews. Selection saves on click.
export default function DesignPicker({
  kitId,
  initialDesign,
  initialTheme,
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [selected, setSelected] = useState<DesignId>(initialDesign);
  const [isOpen, setIsOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const t = setTimeout(() => setSaveStatus("idle"), 2500);
    return () => clearTimeout(t);
  }, [saveStatus]);

  // Close modal on Esc.
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", onKey);
    // Prevent body scroll while modal is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  function handlePick(design: DesignId) {
    if (design === selected) {
      setIsOpen(false);
      return;
    }
    const previous = selected;
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
        setSelected(previous);
        return;
      }
      setSaveStatus("saved");
      setIsOpen(false);
      router.refresh();
    });
  }

  const currentCfg = DESIGNS[selected];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <h2 className="font-semibold text-lg text-slate-900">Design</h2>
          <p className="text-sm text-slate-600">
            The look + layout of this kit&apos;s public page.
          </p>
        </div>
        {saveStatus === "saved" && (
          <span className="text-sm rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1">
            Saved ✓
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div
          className="h-20 w-16 rounded-lg overflow-hidden border border-slate-200 shrink-0"
          style={{ background: currentCfg.previewBg }}
          aria-hidden
        >
          <div className="h-full w-full flex flex-col gap-1 p-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ background: currentCfg.previewAccent, opacity: 0.9 }}
            />
            <div className="h-1.5 w-full rounded-full bg-current opacity-25" />
            <div className="h-1 w-3/4 rounded-full bg-current opacity-15" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
            Current layout
          </p>
          <p className="text-base font-bold text-slate-900">{currentCfg.name}</p>
          <p className="text-xs text-slate-600">{currentCfg.tagline}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition shrink-0"
        >
          Pick kit layout
        </button>
      </div>

      {saveError && (
        <p className="mt-3 text-sm text-red-600">{saveError}</p>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="design-picker-title"
          onClick={(e) => {
            // Click on backdrop closes; clicks inside the panel don't.
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="w-full max-w-5xl max-h-[90vh] overflow-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3
                  id="design-picker-title"
                  className="text-lg font-bold text-slate-900"
                >
                  Pick a kit layout
                </h3>
                <p className="text-sm text-slate-600">
                  Same content, different look. Pick whichever fits the brand
                  you&apos;re sending this kit to.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
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
                      className="aspect-[4/3] relative"
                      style={{ background: cfg.previewBg }}
                    >
                      <div className="absolute inset-4 flex flex-col gap-2">
                        <div
                          className="h-9 w-9 rounded-full shadow"
                          style={{ background: cfg.previewAccent, opacity: 0.9 }}
                        />
                        <div className="h-2.5 w-3/4 rounded-full bg-current opacity-30" />
                        <div className="h-1.5 w-1/2 rounded-full bg-current opacity-20" />
                        <div className="mt-auto grid grid-cols-3 gap-1">
                          <div className="h-4 rounded bg-current opacity-15" />
                          <div className="h-4 rounded bg-current opacity-15" />
                          <div className="h-4 rounded bg-current opacity-15" />
                          <div className="h-4 rounded bg-current opacity-15" />
                          <div className="h-4 rounded bg-current opacity-15" />
                          <div className="h-4 rounded bg-current opacity-15" />
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-pink-600 text-white text-xs font-bold flex items-center justify-center shadow">
                          ✓
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-3 bg-white border-t border-slate-100">
                      <p className="text-sm font-bold text-slate-900">
                        {cfg.name}
                      </p>
                      <p className="text-xs text-slate-600 leading-tight">
                        {cfg.tagline}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                {saving ? "Saving…" : "Click any layout to apply."}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
