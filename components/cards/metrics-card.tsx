import {
  PLATFORM_GROUPS,
  AMAZON_COMBINED_SECTION,
  formatMetricValue,
  getSectionMetrics,
  groupHasAnyMetric,
  normalizeMetrics,
  sectionHasAnyMetric,
  computeCombinedAmazon,
  combinedAmazonHasAnyMetric,
  type MetricsCardData,
  type MetricSection,
  type MetricKey,
  type PlatformGroupConfig,
  type PlatformGroupData,
} from "@/lib/metrics-schema";

type Props = {
  data: MetricsCardData;
};

// Public render of the Metrics card (Classic theme).
// When combine_amazon is on, Amazon is rendered as a single compact card so
// Amazon Performance + TikTok + YouTube can all sit on the same row.
export default function MetricsCard({ data }: Props) {
  const norm = normalizeMetrics(data);
  const combineAmazon = !!data.combine_amazon;

  const visibleGroups = PLATFORM_GROUPS.filter((g) => {
    if (g.id === "amazon" && combineAmazon) {
      return combinedAmazonHasAnyMetric(norm.amazon);
    }
    return groupHasAnyMetric(norm[g.id], g);
  });
  if (visibleGroups.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-6">
      {visibleGroups.map((group) => {
        const isAmazonCombined = group.id === "amazon" && combineAmazon;
        const isCompact = isAmazonCombined || group.sections.length === 1;
        return (
          <div
            key={group.id}
            className={isCompact ? "flex-1 basis-[360px] min-w-[300px]" : "w-full"}
          >
            <PlatformGroupBlock
              group={group}
              groupData={norm[group.id]}
              combined={isAmazonCombined}
            />
          </div>
        );
      })}
    </div>
  );
}

function PlatformGroupBlock({
  group,
  groupData,
  combined,
}: {
  group: PlatformGroupConfig;
  groupData: PlatformGroupData;
  combined: boolean;
}) {
  let renderSections: { section: MetricSection; data: Record<MetricKey, string> }[];

  if (combined) {
    renderSections = [
      {
        section: AMAZON_COMBINED_SECTION,
        data: computeCombinedAmazon(groupData),
      },
    ];
  } else {
    renderSections = group.sections
      .filter((s) => sectionHasAnyMetric(groupData, s.id, s))
      .map((s) => ({ section: s, data: getSectionMetrics(groupData, s.id) ?? {} }));
  }
  if (renderSections.length === 0) return null;

  return (
    <section>
      <header className="text-center mb-3">
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-pink-600">
          {group.label}
        </span>
        {groupData.timeframe && (
          <span className="ml-3 text-xs font-semibold text-slate-600">
            · {groupData.timeframe}
          </span>
        )}
      </header>

      <div className="flex flex-wrap justify-center gap-4">
        {renderSections.map(({ section, data: sectionData }) => {
          const filled = section.metrics.filter(
            (m) => sectionData[m.key] && sectionData[m.key].trim().length > 0
          );
          return (
            <div
              key={section.id}
              className="basis-[280px] grow max-w-md rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
            >
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-900 pb-2 border-b border-slate-200">
                {section.title}
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                {filled.map((metric) => (
                  <div key={metric.key} className="min-w-0">
                    <p className="text-[11px] text-slate-500 uppercase tracking-wide leading-tight">
                      {metric.label}
                    </p>
                    {metric.hint && (
                      <p className="text-[10px] text-slate-400 italic leading-tight">
                        {metric.hint}
                      </p>
                    )}
                    <p className="mt-1 text-lg font-bold text-slate-900 tabular-nums truncate">
                      {formatMetricValue(sectionData[metric.key], metric.format)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
