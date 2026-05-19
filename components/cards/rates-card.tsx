import { formatRateAmount, type RatesCardData } from "@/lib/rates";

type Props = {
  data: RatesCardData;
  /**
   * Optional override classes so theme layouts can tint the card. Falls back
   * to a Classic white-on-pink look.
   */
  className?: string;
  /** Color for the amount text (theme-driven). */
  amountClassName?: string;
  /** Color for the title text. */
  titleClassName?: string;
  /** Color for the description text. */
  descriptionClassName?: string;
  /** Divider color between rate rows. */
  dividerClassName?: string;
  /** Heading class for "Rates" title. */
  headingClassName?: string;
};

// Public render of the Rates card.
// Each rate is a row: title + optional description on the left, amount on the right.
export default function RatesCard({
  data,
  className = "rounded-2xl border border-slate-200 bg-white px-5 py-5 sm:px-6 sm:py-5 shadow-sm",
  amountClassName = "text-pink-600",
  titleClassName = "text-slate-900",
  descriptionClassName = "text-slate-600",
  dividerClassName = "divide-y divide-slate-200",
  headingClassName = "text-lg sm:text-xl font-bold text-slate-900 mb-3",
}: Props) {
  const items = (data.items ?? []).filter(
    (it) => (it.title && it.title.trim()) || (it.amount && it.amount.trim())
  );
  if (items.length === 0) return null;

  return (
    <section className={className}>
      <h2 className={headingClassName}>Content Creation Rates</h2>
      <div className={dividerClassName}>
        {items.map((item) => (
          <div
            key={item.id}
            className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              {item.title && (
                <p className={`text-sm sm:text-base font-semibold leading-snug ${titleClassName}`}>
                  {item.title}
                </p>
              )}
              {item.description && (
                <p className={`mt-1 text-xs sm:text-sm leading-relaxed ${descriptionClassName}`}>
                  {item.description}
                </p>
              )}
            </div>
            {item.amount && (
              <p
                className={`shrink-0 text-right text-sm sm:text-base font-bold whitespace-nowrap ${amountClassName}`}
              >
                {formatRateAmount(item.amount)}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
