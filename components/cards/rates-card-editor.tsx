"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RatesCardData, RateItem } from "@/lib/rates";

type Props = {
  kitId: string;
  card: { id: string; data: RatesCardData; is_visible: boolean } | null;
};

function makeId(): string {
  return Math.random().toString(36).slice(2, 11);
}

// Editor for the Rates card. List of rate rows; each has title, optional
// description, and a free-text amount field.
export default function RatesCardEditor({ kitId, card }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<RateItem[]>(card?.data.items ?? []);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  useEffect(() => {
    if (saveStatus !== "saved") return;
    const t = setTimeout(() => setSaveStatus("idle"), 2500);
    return () => clearTimeout(t);
  }, [saveStatus]);

  function addItem() {
    setItems((curr) => [
      ...curr,
      { id: makeId(), title: "", description: "", amount: "" },
    ]);
  }
  function updateItem(id: string, patch: Partial<RateItem>) {
    setItems((curr) =>
      curr.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }
  function removeItem(id: string) {
    setItems((curr) => curr.filter((item) => item.id !== id));
  }
  function moveItem(id: string, direction: -1 | 1) {
    setItems((curr) => {
      const idx = curr.findIndex((it) => it.id === id);
      if (idx === -1) return curr;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= curr.length) return curr;
      const next = [...curr];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaveStatus("idle");

    const cleaned: RateItem[] = items
      .map((it) => ({
        id: it.id,
        title: it.title.trim(),
        description: it.description?.trim() || undefined,
        amount: it.amount.trim(),
      }))
      .filter((it) => it.title || it.amount);
    const data: RatesCardData = { items: cleaned };

    startSave(async () => {
      const { error } = await supabase.from("cards").upsert(
        {
          kit_id: kitId,
          card_type: "rates",
          position: 25,
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
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-semibold text-lg text-slate-900">Rates</h2>
          <p className="text-sm text-slate-600">
            Your content rate card — brands see this list of services with prices.
          </p>
        </div>
        {saveStatus === "saved" && (
          <span className="text-sm rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1">
            Saved ✓
          </span>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Rate #{idx + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveItem(item.id, -1)}
                  disabled={idx === 0}
                  className="text-xs px-2 py-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(item.id, 1)}
                  disabled={idx === items.length - 1}
                  className="text-xs px-2 py-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="ml-1 text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
            <label className="block">
              <span className="block text-xs font-medium text-slate-700 mb-1">
                Title
              </span>
              <input
                type="text"
                value={item.title}
                onChange={(e) => updateItem(item.id, { title: e.target.value })}
                placeholder="Shoppable video uploaded to Amazon Storefront"
                maxLength={200}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-700 mb-1">
                Description{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </span>
              <textarea
                value={item.description ?? ""}
                onChange={(e) =>
                  updateItem(item.id, { description: e.target.value })
                }
                placeholder="Length, edit style, usage rights, anything else brands should know."
                maxLength={400}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-700 mb-1">
                Rate
              </span>
              <input
                type="text"
                value={item.amount}
                onChange={(e) => updateItem(item.id, { amount: e.target.value })}
                placeholder="$75"
                maxLength={80}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </label>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="mt-4 w-full rounded-lg border-2 border-dashed border-slate-300 hover:border-pink-400 hover:bg-pink-50 px-4 py-3 text-sm font-medium text-slate-700 transition"
      >
        + Add a rate
      </button>

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        {saveError && (
          <span className="text-sm text-red-600 mr-auto">{saveError}</span>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-pink-600 px-5 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {saving ? "Saving…" : "Save rates"}
        </button>
      </div>
    </form>
  );
}
