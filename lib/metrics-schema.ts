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
// Amazon — the existing three sub-sections.
// =========================================================================
export const AMAZON_SECTIONS: MetricSection[] = [
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

export type PlatformGroupId = "amazon" | "tiktok_shop";

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
];

// Per-platform data: timeframe + each section's metrics keyed by sectionId.
// Section keys are spelled out explicitly so TypeScript doesn't fight with
// the `timeframe: string | undefined` field against an index signature.
export type PlatformGroupData = {
  timeframe?: string;
  offsite?: Record<MetricKey, string>;
  onsite?: Record<MetricKey, string>;
  creator_connections?: Record<MetricKey, string>;
  shop?: Record<MetricKey, string>;
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

  // -------- LEGACY (pre-platform-groups) — read-only for backward compat. --------
  /** Old global timeframe — treated as the Amazon timeframe when migrating. */
  timeframe?: string;
  offsite?: Record<MetricKey, string>;
  onsite?: Record<MetricKey, string>;
  creator_connections?: Record<MetricKey, string>;
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
 * Normalize the data to always have both `amazon` and `tiktok_shop` keys,
 * migrating any legacy flat fields into the `amazon` group transparently.
 */
export function normalizeMetrics(
  data: MetricsCardData | undefined | null
): { amazon: PlatformGroupData; tiktok_shop: PlatformGroupData } {
  const d = data ?? {};
  const amazon: PlatformGroupData = d.amazon
    ? d.amazon
    : {
        timeframe: d.timeframe,
        offsite: d.offsite,
        onsite: d.onsite,
        creator_connections: d.creator_connections,
      };
  const tiktok_shop: PlatformGroupData = d.tiktok_shop ?? {};
  return { amazon, tiktok_shop };
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
