import { PLATFORMS } from "@/lib/platforms";
import PlatformIcon from "./platform-icon";
import type { ProfilePlatformLink } from "./profile-card-editor";

type Props = {
  links: ProfilePlatformLink[];
};

// Footer "Find me" row of platform link badges.
// Renders one rounded tile per link with the platform icon + label.
export default function PlatformLinks({ links }: Props) {
  if (!links || links.length === 0) return null;

  return (
    <section>
      <header className="text-center mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-pink-600">
          Find me
        </p>
      </header>
      <div className="flex flex-wrap justify-center gap-3">
        {links.map((link) => {
          const cfg = PLATFORMS[link.platform];
          const displayLabel = link.label || cfg.label;
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white pl-1.5 pr-4 py-1.5 shadow-sm hover:shadow-md hover:border-pink-200 transition"
            >
              <PlatformIcon platform={link.platform} size={32} />
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  {cfg.shortLabel}
                </span>
                <span className="text-sm font-semibold text-slate-900 group-hover:text-pink-700 transition">
                  {displayLabel}
                </span>
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
