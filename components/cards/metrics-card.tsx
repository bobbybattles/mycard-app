import {
  METRIC_SECTIONS,
  sectionHasAnyMetric,
  type MetricsCardData,
} from "@/lib/metrics-schema";

type Props = {
  data: MetricsCardData;
};

// Public render of the Metrics card.
// Layout: one card per section (Offsite / Onsite / Creator Connections),
// all on the same row. Inside each card, stats flow into exactly 2 rows
// so the card grows horizontally as more metrics are filled in.
export default function MetricsCard({ data }: Props) {
  const visibleSections = METRIC_SECTIONS.filter((s) =>
    sectionHasAnyMetric(data, s.id)
  );
  if (visibleSections.length === 0) return null;

  return (
    <section>
      <header className="text-center mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-pink-600">
          Performance
        </p>
        {data.timeframe && (
          <p className="mt-1 text-sm font-semibold text-slate-700">
            {data.timeframe}
          </p>
        )}
      </header>

      {/* Cards row: stacks on mobile, flows side-by-side on md+.
          Each card sizes to its content (flex-1 + flex-wrap), so a section
          with more filled metrics naturally claims more horizontal room. */}
      <div className="flex flex-wrap justify-center gap-5">
        {visibleSections.map((section) => {
          const sectionData = data[section.id] ?? {};
          const filledMetrics = section.metrics.filter(
            (m) => sectionData[m.key] && sectionData[m.key].trim().length > 0
          );
          // Number of columns inside this card = ceil(filled / 2), capped so
          // very tall cards don't blow out the line width.
          const cols = Math.min(Math.max(Math.ceil(filledMetrics.length / 2), 1), 5);
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
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                }}
              >
                {filledMetrics.map((metric) => (
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
