import {
  METRIC_SECTIONS,
  sectionHasAnyMetric,
  type MetricsCardData,
} from "@/lib/metrics-schema";

type Props = {
  data: MetricsCardData;
};

// Map "how many filled sections" -> Tailwind grid column classes.
// 1 → centered single column; 2 → 2 cols on md+; 3 → 3 cols on lg+ (2 on md).
function gridClassesFor(count: number): string {
  if (count <= 1) return "grid grid-cols-1 max-w-md mx-auto";
  if (count === 2) return "grid grid-cols-1 md:grid-cols-2 gap-5";
  return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5";
}

// Public render of the Metrics card.
// Wraps all three sub-sections in a single "Performance" container so they
// share a header (with the user-selected timeframe) and sit side by side.
export default function MetricsCard({ data }: Props) {
  const visibleSections = METRIC_SECTIONS.filter((s) =>
    sectionHasAnyMetric(data, s.id)
  );
  if (visibleSections.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
      <header className="text-center mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-pink-600">
          Performance
        </p>
        {data.timeframe && (
          <p className="mt-1 text-sm font-semibold text-slate-700">
            {data.timeframe}
          </p>
        )}
      </header>

      <div className={gridClassesFor(visibleSections.length)}>
        {visibleSections.map((section) => {
          const sectionData = data[section.id] ?? {};
          const filledMetrics = section.metrics.filter(
            (m) => sectionData[m.key] && sectionData[m.key].trim().length > 0
          );
          return (
            <div
              key={section.id}
              className="rounded-xl border border-slate-100 bg-slate-50/60 px-5 py-5"
            >
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 pb-3 border-b border-slate-200">
                {section.title}
              </h3>
              <div className="mt-4 space-y-4">
                {filledMetrics.map((metric) => (
                  <div key={metric.key}>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wide">
                      {metric.label}
                    </p>
                    {metric.hint && (
                      <p className="text-[10px] text-slate-400 italic">
                        {metric.hint}
                      </p>
                    )}
                    <p className="mt-0.5 text-xl font-bold text-slate-900 tabular-nums">
                      {sectionData[metric.key]}
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
