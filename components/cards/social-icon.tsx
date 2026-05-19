// Simple, recognizable SVG icons for the social profile types.
// Same circular gradient tile pattern as PlatformIcon.

import type { SocialType } from "@/lib/socials";
import { SOCIALS } from "@/lib/socials";

type Props = {
  type: SocialType;
  size?: number;
  className?: string;
};

function Inner({ type }: { type: SocialType }) {
  switch (type) {
    case "x":
      return (
        <svg viewBox="0 0 24 24" width="55%" height="55%" aria-hidden>
          <path
            d="M16.6 4h2.7l-5.9 6.7L20 20h-5.4l-4.3-5.6L5.4 20H2.7l6.4-7.3L2 4h5.5l3.9 5.2L16.6 4zm-1 14.4h1.5L7.6 5.5H6L15.6 18.4z"
            fill="#fff"
          />
        </svg>
      );
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" width="55%" height="55%" aria-hidden>
          <path
            d="M6 9h3v10H6V9zm1.5-4.5a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4zM11 9h2.9v1.4h.04c.4-.8 1.4-1.6 2.9-1.6 3 0 3.6 2 3.6 4.6V19h-3v-5c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V19h-3V9z"
            fill="#fff"
          />
        </svg>
      );
    case "pinterest":
      return (
        <svg viewBox="0 0 24 24" width="58%" height="58%" aria-hidden>
          <path
            d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.6 2.2-.9 3.4-.2 1 .5 1.9 1.6 1.9 1.9 0 3.3-2 3.3-4.8 0-2.5-1.8-4.3-4.5-4.3a4.7 4.7 0 0 0-4.9 4.7c0 .9.4 2 .8 2.5l.1.3-.3 1c-.1.2-.2.3-.4.1-1-.5-1.6-2.1-1.6-3.4 0-2.7 2-5.2 5.7-5.2 3 0 5.4 2.1 5.4 5 0 3-1.9 5.4-4.5 5.4-.9 0-1.7-.5-2-1l-.5 2c-.2.7-.7 1.6-1 2.2a10 10 0 1 0 3.3-19.7z"
            fill="#fff"
          />
        </svg>
      );
    case "threads":
      return (
        <svg viewBox="0 0 24 24" width="55%" height="55%" aria-hidden>
          <path
            d="M12.2 22A9.8 9.8 0 0 1 2 12.2C2 6.5 5.9 2 12 2c5 0 9 3 9.7 7.6h-2.5C18.6 6.5 16 4.3 12 4.3c-4.6 0-7.5 3.5-7.5 7.9 0 4.4 3 7.5 7.7 7.5 3.4 0 5.5-1.6 5.5-3.5 0-1.4-1-2.3-2.7-2.6-.4 1.6-1.6 2.5-3.4 2.5-2 0-3.4-1.2-3.4-3 0-1.8 1.5-2.9 3.7-2.9.8 0 1.6.1 2.2.3 0-1.4-1-2.2-2.6-2.2-1 0-1.9.3-2.7 1l-1.2-1.7a6 6 0 0 1 4-1.5c2.9 0 4.8 1.7 4.9 4.4 2.4.5 3.9 2.2 3.9 4.6 0 3.5-3 5.7-7.7 5.7zm-1-7.3c-1 0-1.7.4-1.7 1.1 0 .7.7 1.2 1.7 1.2 1.1 0 1.7-.6 1.9-1.7-.5-.4-1.2-.6-1.9-.6z"
            fill="#fff"
          />
        </svg>
      );
    case "snapchat":
      return (
        <svg viewBox="0 0 24 24" width="60%" height="60%" aria-hidden>
          <path
            d="M12 3c-3 0-4.6 2.4-4.6 4.7v1.7c-.4-.2-1-.4-1.4-.3-.7.2-.8.7-.5 1.3.2.5 1 1 1.7 1.2.2.8-.5 2.6-1.5 3.5-.8.8-2.7 1.2-2.6 1.7.2.5 1.5.7 2 1l.4 1c.2.4 1.3 0 2.5.3 1 .2 1.6 1.5 3.5 1.5h.2c1.9 0 2.5-1.3 3.5-1.5 1.2-.3 2.3.1 2.5-.3l.4-1c.5-.3 1.8-.5 2-1 .1-.5-1.8-.9-2.6-1.7-1-.9-1.7-2.7-1.5-3.5.7-.2 1.5-.7 1.7-1.2.3-.6.2-1-.5-1.3-.4 0-1 .1-1.4.3V7.7C16.7 5.4 15 3 12 3z"
            fill="#222"
          />
        </svg>
      );
    case "website":
      return (
        <svg viewBox="0 0 24 24" width="58%" height="58%" aria-hidden>
          <circle cx="12" cy="12" r="9" fill="none" stroke="#fff" strokeWidth="2" />
          <path
            d="M3 12h18M12 3c2.5 3 3.8 6 3.8 9s-1.3 6-3.8 9c-2.5-3-3.8-6-3.8-9s1.3-6 3.8-9z"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
          />
        </svg>
      );
  }
}

export default function SocialIcon({ type, size = 32, className = "" }: Props) {
  const cfg = SOCIALS[type];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${cfg.gradient.from}, ${cfg.gradient.to})`,
      }}
      aria-label={cfg.label}
    >
      <Inner type={type} />
    </span>
  );
}
