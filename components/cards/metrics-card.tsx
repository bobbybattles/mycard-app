import {
  PLATFORM_GROUPS,
  formatMetricValue,
  getSectionMetrics,
  groupHasAnyMetric,
  normalizeMetrics,
  sectionHasAnyMetric,
  type MetricsCardData,
  type PlatformGroupConfig,
  type PlatformGroupData,
} from "@/lib/metrics-schema";

type Props = {
  data: MetricsCardData;
};

// Public render of the Metrics card (Classic theme).
// Renders each platform group (Amazon, TikTok Shop) as its own labeled block
// with its own timeframe and stat sub-sections.
export default function MetricsCard({ data }: Props) {
  const norm = normalizeMetrics(data);
  const visibleGroups = PLATFORM_GROUPS.filter((g) => groupHasAnyMetric(norm[g.id], g));
  if (visibleGroups.length === 0) return null;

  return (
    <div className="space-y-12">
      {visibleGroups.map((group) => (
        <PlatformGroupBlock
          key={group.id}
          group={group}
          groupData={norm[group.id]}
        />
      ))}
    </div>
  );
}

function PlatformGroupBlock({
  group,
  groupData,
}: {
  group: PlatformGroupConfig;
  groupData: PlatformGroupData;
}) {
  const visibleSections = group.sections.filter((s) =>
    sectionHasAnyMetric(groupData, s.id, s)
  );
  if (visibleSections.length === 0) return null;

  return (
    <section>
      <header className="text-center mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-pink-600">
          {group.label}
        </p>
        {groupData.timeframe && (
          <p className="mt-1 text-sm font-semibold text-slate-700">
            {groupData.timeframe}
          </p>
        )}
      </header>

      <div className="flex flex-wrap justify-center gap-5">
        {visibleSections.map((section) => {
          const sectionData = getSectionMetrics(groupData, section.id) ?? {};
          const filled = section.metrics.filter(
            (m) => sectionData[m.key] && sectionData[m.key].trim().length > 0
          );
          const cols = Math.min(Math.max(Math.ceil(filled.length / 2), 1), 5);
          return (
            <div
              key={section.id}
              className="flex-1 min-w-[280px] rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm"
            >
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 pb-3 border-b border-slate-200">
                {section.title}
              </h3>
              <div
                className="mt-4 grid grid-rows-2 grid-flow-col gap-x-5 gap-y-4"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
              >
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
