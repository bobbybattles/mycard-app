// Schema describing the Metrics card sections + which metrics live in each.
// Drives both the dashboard editor and the public render.
//
// Values are stored as free-text strings, but each metric carries a `format`
// so the public renderer can present a bare number nicely (e.g. "5880.73" ->
// "$5,880.73", "5.49" -> "5.49%", "133521" -> "133,521"). If the user typed
// their own formatting (currency symbol, %, or commas), we render it verbatim.

export type MetricKey = string;
export type MetricFormat = "number" | "percent" | "currency";

export type MetricDef = {
  key: MetricKey;
  label: string;
  /** Sub-label shown small under the main label (e.g. "Includes Bonus"). */
  hint?: string;
  /** Example value shown as input placeholder. */
  placeholder: string;
  /** How to format the value on the public kit if the user typed a bare number. */
  format: MetricFormat;
};

export type MetricSection = {
  id: "offsite" | "onsite" | "creator_connections";
  title: string;
  metrics: MetricDef[];
};

export const METRIC_SECTIONS: MetricSection[] = [
  {
    id: "offsite",
    title: "Offsite",
    metrics: [
      { key: "clicks", label: "Clicks", placeholder: "2,058", format: "number" },
      { key: "ordered_items", label: "Ordered Items", placeholder: "113", format: "number" },
      { key: "conversion", label: "Conversion", placeholder: "5.49%", format: "percent" },
      { key: "ordered_revenue", label: "Ordered Revenue", placeholder: "$5,880.73", format: "currency" },
      { key: "shipped_items", label: "Shipped Items", placeholder: "107", format: "number" },
      { key: "returned_items", label: "Returned Items", placeholder: "6", format: "number" },
      { key: "total_revenue", label: "Total Revenue", placeholder: "$4,593.75", format: "currency" },
      { key: "bonus", label: "Bonus", placeholder: "$0.00", format: "currency" },
      {
        key: "total_earnings",
        label: "Total Earnings",
        hint: "Includes Bonus",
        placeholder: "$120.03",
        format: "currency",
      },
    ],
  },
  {
    id: "onsite",
    title: "Onsite",
    metrics: [
      { key: "clicks", label: "Clicks", placeholder: "133,521", format: "number" },
      { key: "conversion", label: "Conversion", placeholder: "4.06%", format: "percent" },
      { key: "shipped_items", label: "Shipped Items", placeholder: "5,415", format: "number" },
      { key: "returned_items", label: "Returned Items", placeholder: "147", format: "number" },
      { key: "total_revenue", label: "Total Revenue", placeholder: "$201,156.26", format: "currency" },
      { key: "bonus", label: "Bonus", placeholder: "$0.00", format: "currency" },
      {
        key: "total_earnings",
        label: "Total Earnings",
        hint: "Includes Bonus",
        placeholder: "$2,905.80",
        format: "currency",
      },
    ],
  },
  {
    id: "creator_connections",
    title: "Creator Connections",
    metrics: [
      { key: "connection_earnings", label: "Connection earnings", placeholder: "$32,473.39", format: "currency" },
      { key: "connection_revenue", label: "Connection revenue", placeholder: "$254,632.43", format: "currency" },
      { key: "total_clicks", label: "Total clicks", placeholder: "48,843", format: "number" },
      { key: "total_orders", label: "Total orders", placeholder: "4,914", format: "number" },
      { key: "shipped_items", label: "Shipped items", placeholder: "5,026", format: "number" },
    ],
  },
];

export type MetricsCardData = {
  /** Which time window these numbers cover. Shown on the public kit. */
  timeframe?: string;
  offsite?: Record<MetricKey, string>;
  onsite?: Record<MetricKey, string>;
  creator_connections?: Record<MetricKey, string>;
};

/** Common timeframe presets shown in the metrics editor's dropdown. */
export const TIMEFRAME_OPTIONS: string[] = [
  "Last 7 days",
  "Last 30 days",
  "Last 60 days",
  "Last 90 days",
  "Last 6 months",
  "Last 12 months",
  "Year to date",
  "All time",
];

/** True if any metric in the entire card has a non-empty value. */
export function hasAnyMetric(data: MetricsCardData | undefined | null): boolean {
  if (!data) return false;
  for (const section of METRIC_SECTIONS) {
    const sectionData = data[section.id];
    if (!sectionData) continue;
    for (const metric of section.metrics) {
      const v = sectionData[metric.key];
      if (v && v.trim().length > 0) return true;
    }
  }
  return false;
}

/** True if a specific section has any non-empty metric. */
export function sectionHasAnyMetric(
  data: MetricsCardData | undefined | null,
  sectionId: MetricSection["id"]
): boolean {
  if (!data) return false;
  const sectionData = data[sectionId];
  if (!sectionData) return false;
  const section = METRIC_SECTIONS.find((s) => s.id === sectionId);
  if (!section) return false;
  return section.metrics.some(
    (m) => sectionData[m.key] && sectionData[m.key].trim().length > 0
  );
}

/**
 * Pretty-print a raw metric value for the public kit.
 *
 * If the value looks like a bare number (digits + optional single decimal),
 * we format it according to `format`. Otherwise we return it verbatim — this
 * preserves anything the user already styled themselves ("$5,880.73",
 * "5.49%", "1,000", "N/A", etc.).
 */
export function formatMetricValue(value: string, format: MetricFormat): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  const isBareNumber = /^-?\d+(\.\d+)?$/.test(trimmed);
  if (!isBareNumber) return trimmed;

  const num = parseFloat(trimmed);
  if (!Number.isFinite(num)) return trimmed;

  if (format === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }

  if (format === "percent") {
    // Keep the user's original decimal precision (e.g. "5.49" -> "5.49%", "5" -> "5%").
    const decimals = trimmed.includes(".") ? trimmed.split(".")[1].length : 0;
    return `${num.toFixed(decimals)}%`;
  }

  // "number" — comma-separated, preserving any decimals the user typed.
  const decimals = trimmed.includes(".") ? trimmed.split(".")[1].length : 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}
