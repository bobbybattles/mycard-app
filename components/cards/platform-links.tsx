import { getLinkTypeConfig, type ProfileLink } from "@/lib/links";
import LinkIcon from "./link-icon";

type Props = {
  links: ProfileLink[];
  /** When true, render as a side-card with a heading and pills. */
  asCard?: boolean;
};

// "Find me" row of branded pills. Renders the unified link list.
// `asCard` makes this a self-contained card that sits next to the profile.
export default function PlatformLinks({ links, asCard = false }: Props) {
  if (!links || links.length === 0) return null;

  const pills = (
    <div className={asCard ? "flex flex-wrap gap-2" : "flex flex-wrap justify-center gap-3"}>
      {links.map((link) => {
        const cfg = getLinkTypeConfig(link.type);
        const displayLabel = link.label || cfg.label;
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-1.5 pr-3.5 py-1.5 shadow-sm hover:shadow-md hover:border-pink-200 transition"
          >
            <LinkIcon type={link.type} size={28} />
            <span className="flex flex-col items-start leading-tight">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
                {cfg.shortLabel}
              </span>
              <span className="text-xs font-semibold text-slate-900 group-hover:text-pink-700 transition">
                {displayLabel}
              </span>
            </span>
          </a>
        );
      })}
    </div>
  );

  if (asCard) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 sm:px-6 sm:py-5 shadow-sm h-full">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3">
          Find me
        </h2>
        {pills}
      </section>
    );
  }

  return (
    <section>
      <header className="text-center mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-pink-600">
          Find me
        </p>
      </header>
      {pills}
    </section>
  );
}
