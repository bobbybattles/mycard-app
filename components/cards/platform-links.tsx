import { PLATFORMS } from "@/lib/platforms";
import { SOCIALS } from "@/lib/socials";
import PlatformIcon from "./platform-icon";
import SocialIcon from "./social-icon";
import type {
  ProfilePlatformLink,
  ProfileSocialLink,
} from "./profile-card-editor";

type Props = {
  links: ProfilePlatformLink[];
  socials?: ProfileSocialLink[];
};

// Footer "Find me" row of branded pills for both platforms and social profiles.
export default function PlatformLinks({ links, socials }: Props) {
  const hasPlatforms = links && links.length > 0;
  const hasSocials = socials && socials.length > 0;
  if (!hasPlatforms && !hasSocials) return null;

  return (
    <section>
      <header className="text-center mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-pink-600">
          Find me
        </p>
      </header>
      <div className="flex flex-wrap justify-center gap-3">
        {hasPlatforms &&
          links.map((link) => {
            const cfg = PLATFORMS[link.platform];
            const displayLabel = link.label || cfg.label;
            return (
              <a
                key={`p-${link.id}`}
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
        {hasSocials &&
          socials!.map((s) => {
            const cfg = SOCIALS[s.type];
            const displayLabel = s.label || cfg.label;
            return (
              <a
                key={`s-${s.id}`}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white pl-1.5 pr-4 py-1.5 shadow-sm hover:shadow-md hover:border-pink-200 transition"
              >
                <SocialIcon type={s.type} size={32} />
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
