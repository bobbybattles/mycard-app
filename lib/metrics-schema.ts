// Schema describing the Metrics card sections + which metrics live in each.
// Drives both the dashboard editor and the public render.
// Values are stored as free-text strings so users can paste them exactly
// from Amazon (e.g. "$5,880.73", "5.49%", "2,058") and we render verbatim.

export type MetricKey = string;

export type MetricDef = {
  key: MetricKey;
  label: string;
  /** Sub-label shown small under the main label (e.g. "Includes Bonus"). */
  hint?: string;
  /** Example value shown as input placeholder. */
  placeholder: string;
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
      { key: "clicks", label: "Clicks", placeholder: "2,058" },
      { key: "ordered_items", label: "Ordered Items", placeholder: "113" },
      { key: "conversion", label: "Conversion", placeholder: "5.49%" },
      { key: "ordered_revenue", label: "Ordered Revenue", placeholder: "$5,880.73" },
      { key: "shipped_items", label: "Shipped Items", placeholder: "107" },
      { key: "returned_items", label: "Returned Items", placeholder: "6" },
      { key: "total_revenue", label: "Total Revenue", placeholder: "$4,593.75" },
      { key: "bonus", label: "Bonus", placeholder: "$0.00" },
      {
        key: "total_earnings",
        label: "Total Earnings",
        hint: "Includes Bonus",
        placeholder: "$120.03",
      },
    ],
  },
  {
    id: "onsite",
    title: "Onsite",
    metrics: [
      { key: "clicks", label: "Clicks", placeholder: "133,521" },
      { key: "conversion", label: "Conversion", placeholder: "4.06%" },
      { key: "shipped_items", label: "Shipped Items", placeholder: "5,415" },
      { key: "returned_items", label: "Returned Items", placeholder: "147" },
      { key: "total_revenue", label: "Total Revenue", placeholder: "$201,156.26" },
      { key: "bonus", label: "Bonus", placeholder: "$0.00" },
      {
        key: "total_earnings",
        label: "Total Earnings",
        hint: "Includes Bonus",
        placeholder: "$2,905.80",
      },
    ],
  },
  {
    id: "creator_connections",
    title: "Creator Connections",
    metrics: [
      { key: "connection_earnings", label: "Connection earnings", placeholder: "$32,473.39" },
      { key: "connection_revenue", label: "Connection revenue", placeholder: "$254,632.43" },
      { key: "total_clicks", label: "Total clicks", placeholder: "48,843" },
      { key: "total_orders", label: "Total orders", placeholder: "4,914" },
      { key: "shipped_items", label: "Shipped items", placeholder: "5,026" },
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
