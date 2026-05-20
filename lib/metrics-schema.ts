// Schema describing the Metrics card.
//
// Top-level structure: two PLATFORM groups (Amazon + TikTok Shop), each with
// its own time frame. Each group has one or more sub-sections of metrics.
//
// Values are stored as free-text strings, but each metric carries a `format`
// so the public renderer can present a bare number nicely (e.g. "5880.73" ->
// "$5,880.73"). If the user typed their own formatting it's rendered verbatim.

export type MetricKey = string;
export type MetricFormat = "number" | "percent" | "currency";

export type MetricDef = {
  key: MetricKey;
  label: string;
  hint?: string;
  placeholder: string;
  format: MetricFormat;
};

export type MetricSection = {
  id: string;
  title: string;
  metrics: MetricDef[];
};

// =========================================================================
// Amazon — Offsite + Onsite. Each section shares the same metric shape so
// they can be combined into a single "Amazon Performance" card when the
// creator prefers a denser layout.
// =========================================================================

const AMAZON_PERFORMANCE_METRICS: MetricDef[] = [
  { key: "clicks", label: "Clicks", placeholder: "2,058", format: "number" },
  { key: "conversion", label: "Conversion", placeholder: "5.49%", format: "percent" },
  { key: "shipped_items", label: "Shipped Items", placeholder: "107", format: "number" },
  { key: "total_revenue", label: "Total Revenue", placeholder: "$4,593.75", format: "currency" },
  { key: "bonus", label: "Bonus", placeholder: "$0.00", format: "currency" },
  {
    key: "total_earnings",
    label: "Total Earnings",
    hint: "Includes Bonus",
    placeholder: "$120.03",
    format: "currency",
  },
];

export const AMAZON_SECTIONS: MetricSection[] = [
  {
    id: "offsite",
    title: "Offsite",
    metrics: AMAZON_PERFORMANCE_METRICS,
  },
  {
    id: "onsite",
    title: "Onsite",
    metrics: AMAZON_PERFORMANCE_METRICS.map((m) =>
      m.key === "clicks"
        ? { ...m, placeholder: "133,521" }
        : m.key === "conversion"
        ? { ...m, placeholder: "4.06%" }
        : m.key === "shipped_items"
        ? { ...m, placeholder: "5,415" }
        : m.key === "total_revenue"
        ? { ...m, placeholder: "$201,156.26" }
        : m.key === "total_earnings"
        ? { ...m, placeholder: "$2,905.80" }
        : m
    ),
  },
];

/** Single combined card definition (used when combine_amazon is true). */
export const AMAZON_COMBINED_SECTION: MetricSection = {
  id: "amazon_performance",
  title: "Amazon Performance",
  metrics: AMAZON_PERFORMANCE_METRICS,
};

// =========================================================================
// TikTok Shop — one section with the four standard creator-side metrics.
// =========================================================================
export const TIKTOK_SHOP_SECTIONS: MetricSection[] = [
  {
    id: "shop",
    title: "Shop performance",
    metrics: [
      { key: "attr_gmv", label: "Attr. GMV", placeholder: "$1,234.56", format: "currency" },
      { key: "attr_items_sold", label: "Attr. Items Sold", placeholder: "123", format: "number" },
      { key: "product_impressions", label: "Product Impressions", placeholder: "10,000", format: "number" },
      { key: "product_clicks", label: "Product Clicks", placeholder: "500", format: "number" },
    ],
  },
];

// =========================================================================
// YouTube — one section with channel performance + commerce metrics.
// =========================================================================
export const YOUTUBE_SECTIONS: MetricSection[] = [
  {
    id: "channel",
    title: "Channel performance",
    metrics: [
      { key: "subscribers", label: "Subscribers", placeholder: "12,345", format: "number" },
      { key: "views", label: "Views", placeholder: "1,234,567", format: "number" },
      { key: "watch_time_hours", label: "Watch Time (Hours)", placeholder: "5,432", format: "number" },
      { key: "estimated_revenue", label: "Estimated Revenue", placeholder: "$1,234.56", format: "currency" },
      { key: "total_sales", label: "Total Sales", placeholder: "$5,678.90", format: "currency" },
      { key: "orders", label: "Orders", placeholder: "456", format: "number" },
      { key: "product_clicks", label: "Product Clicks", placeholder: "789", format: "number" },
    ],
  },
];

export type PlatformGroupId = "amazon" | "tiktok_shop" | "youtube";

export type PlatformGroupConfig = {
  id: PlatformGroupId;
  /** Heading shown to brands on the public kit. */
  label: string;
  /** Sub-sections inside this platform group. */
  sections: MetricSection[];
};

export const PLATFORM_GROUPS: PlatformGroupConfig[] = [
  { id: "amazon", label: "Amazon", sections: AMAZON_SECTIONS },
  { id: "tiktok_shop", label: "TikTok Shop", sections: TIKTOK_SHOP_SECTIONS },
  { id: "youtube", label: "YouTube", sections: YOUTUBE_SECTIONS },
];

// Per-platform data: timeframe + each section's metrics keyed by sectionId.
// Section keys are spelled out explicitly so TypeScript doesn't fight with
// the `timeframe: string | undefined` field against an index signature.
export type PlatformGroupData = {
  timeframe?: string;
  offsite?: Record<MetricKey, string>;
  onsite?: Record<MetricKey, string>;
  shop?: Record<MetricKey, string>;
  channel?: Record<MetricKey, string>;
};

/** Read a section's metrics by sectionId (handles the dynamic key lookup). */
export function getSectionMetrics(
  groupData: PlatformGroupData | undefined,
  sectionId: string
): Record<MetricKey, string> | undefined {
  if (!groupData) return undefined;
  const v = (groupData as Record<string, unknown>)[sectionId];
  if (v && typeof v === "object") return v as Record<MetricKey, string>;
  return undefined;
}

// Persisted shape on cards.data for card_type = "metrics".
export type MetricsCardData = {
  amazon?: PlatformGroupData;
  tiktok_shop?: PlatformGroupData;
  youtube?: PlatformGroupData;
  /**
   * When true, the public kit shows a single combined "Amazon Performance"
   * card instead of separate Offsite + Onsite cards. The Offsite/Onsite
   * values are summed (or averaged for conversion).
   */
  combine_amazon?: boolean;

  // -------- LEGACY (pre-platform-groups) — read-only for backward compat. --------
  /** Old global timeframe — treated as the Amazon timeframe when migrating. */
  timeframe?: string;
  offsite?: Record<MetricKey, string>;
  onsite?: Record<MetricKey, string>;
};

/** Common timeframe presets shown in the editor dropdown. */
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

/**
 * Normalize the data to always have all platform group keys present,
 * migrating any legacy flat fields into the `amazon` group transparently.
 */
export function normalizeMetrics(
  data: MetricsCardData | undefined | null
): {
  amazon: PlatformGroupData;
  tiktok_shop: PlatformGroupData;
  youtube: PlatformGroupData;
} {
  const d = data ?? {};
  const amazon: PlatformGroupData = d.amazon
    ? d.amazon
    : {
        timeframe: d.timeframe,
        offsite: d.offsite,
        onsite: d.onsite,
      };
  const tiktok_shop: PlatformGroupData = d.tiktok_shop ?? {};
  const youtube: PlatformGroupData = d.youtube ?? {};
  return { amazon, tiktok_shop, youtube };
}

/** True if any metric in any platform group has a non-empty value. */
export function hasAnyMetric(data: MetricsCardData | undefined | null): boolean {
  const norm = normalizeMetrics(data);
  for (const group of PLATFORM_GROUPS) {
    if (groupHasAnyMetric(norm[group.id], group)) return true;
  }
  return false;
}

/** True if a specific platform group has any non-empty metric. */
export function groupHasAnyMetric(
  groupData: PlatformGroupData | undefined,
  group: PlatformGroupConfig
): boolean {
  if (!groupData) return false;
  for (const section of group.sections) {
    if (sectionHasAnyMetric(groupData, section.id, section)) return true;
  }
  return false;
}

/** True if a specific section inside a group has any non-empty metric. */
export function sectionHasAnyMetric(
  groupData: PlatformGroupData | undefined,
  sectionId: string,
  section: MetricSection
): boolean {
  if (!groupData) return false;
  const sectionData = getSectionMetrics(groupData, sectionId);
  if (!sectionData) return false;
  return section.metrics.some(
    (m) => sectionData[m.key] && sectionData[m.key].trim().length > 0
  );
}

/**
 * Pretty-print a raw metric value for the public kit.
 * Bare numbers get formatted; user-typed formatting passes through verbatim.
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
    const decimals = trimmed.includes(".") ? trimmed.split(".")[1].length : 0;
    return `${num.toFixed(decimals)}%`;
  }

  const decimals = trimmed.includes(".") ? trimmed.split(".")[1].length : 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

// -------- Re-exports for backward compat with files that still import them. --------
/** @deprecated Use AMAZON_SECTIONS or iterate PLATFORM_GROUPS. */
export const METRIC_SECTIONS = AMAZON_SECTIONS;

// =========================================================================
// Combined Amazon Performance computation.
// Sums Offsite + Onsite for clicks / shipped_items / total_revenue / bonus /
// total_earnings, and averages the two conversion rates.
// =========================================================================

/** Parse a free-text metric value (strips $, %, commas) into a number, or null. */
function parseMetricNumber(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/[$,%\s]/g, "");
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Format a number back to a string the metric formatter can render. */
function numToString(n: number): string {
  if (Number.isInteger(n)) return String(n);
  // Trim trailing zeros but keep up to 2 decimals.
  return n.toFixed(2).replace(/\.?0+$/, "");
}

/**
 * Compute the combined Amazon Performance metric values from Offsite + Onsite.
 * Returns a Record<metricKey, string> ready to be rendered by formatMetricValue.
 */
export function computeCombinedAmazon(
  groupData: PlatformGroupData
): Record<MetricKey, string> {
  const offsite = groupData.offsite ?? {};
  const onsite = groupData.onsite ?? {};

  const sumKey = (key: string): string | undefined => {
    const a = parseMetricNumber(offsite[key]);
    const b = parseMetricNumber(onsite[key]);
    if (a === null && b === null) return undefined;
    return numToString((a ?? 0) + (b ?? 0));
  };

  const avgKey = (key: string): string | undefined => {
    const a = parseMetricNumber(offsite[key]);
    const b = parseMetricNumber(onsite[key]);
    if (a === null && b === null) return undefined;
    if (a === null) return numToString(b as number);
    if (b === null) return numToString(a);
    return numToString((a + b) / 2);
  };

  const out: Record<MetricKey, string> = {};
  const clicks = sumKey("clicks");
  const conv = avgKey("conversion");
  const shipped = sumKey("shipped_items");
  const revenue = sumKey("total_revenue");
  const bonus = sumKey("bonus");
  const earnings = sumKey("total_earnings");
  if (clicks !== undefined) out.clicks = clicks;
  if (conv !== undefined) out.conversion = conv;
  if (shipped !== undefined) out.shipped_items = shipped;
  if (revenue !== undefined) out.total_revenue = revenue;
  if (bonus !== undefined) out.bonus = bonus;
  if (earnings !== undefined) out.total_earnings = earnings;
  return out;
}

/** True if computed combined Amazon has any non-empty metric. */
export function combinedAmazonHasAnyMetric(groupData: PlatformGroupData): boolean {
  return Object.keys(computeCombinedAmazon(groupData)).length > 0;
}
