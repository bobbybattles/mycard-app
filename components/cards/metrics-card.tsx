import {
  METRIC_SECTIONS,
  sectionHasAnyMetric,
  type MetricsCardData,
} from "@/lib/metrics-schema";

type Props = {
  data: MetricsCardData;
};

// Public render of the Metrics card.
// Each of the three sections only appears if it has at least one filled metric.
// Each filled metric is rendered as a small stat tile (label on top, value below).
export default function MetricsCard({ data }: Props) {
  // If nothing's filled in across the whole card, parent decides whether to show it.
  return (
    <div className="space-y-6">
      {METRIC_SECTIONS.map((section) => {
        if (!sectionHasAnyMetric(data, section.id)) return null;
        const sectionData = data[section.id] ?? {};
        const filledMetrics = section.metrics.filter(
          (m) => sectionData[m.key] && sectionData[m.key].trim().length > 0
        );

        return (
          <section
            key={section.id}
            className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm"
          >
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {section.title}
            </h3>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
              {filledMetrics.map((metric) => (
                <div key={metric.key}>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">
                    {metric.label}
                  </p>
                  {metric.hint && (
                    <p className="text-[10px] text-slate-400 italic">
                      {metric.hint}
                    </p>
                  )}
                  <p className="mt-0.5 text-lg font-bold text-slate-900 tabular-nums">
                    {sectionData[metric.key]}
                  </p>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
