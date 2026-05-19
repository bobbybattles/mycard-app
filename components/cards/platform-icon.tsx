// Simple, brand-recognizable SVG icons for the six supported platforms.
// Each renders inside a colored circular tile so they look consistent
// regardless of the underlying icon shape.

import type { Platform } from "@/lib/platforms";
import { PLATFORMS } from "@/lib/platforms";

type Props = {
  platform: Platform;
  size?: number;
  className?: string;
};

function Inner({ platform }: { platform: Platform }) {
  // 24x24 viewBox glyphs. Generic shapes that suggest each brand without
  // copying their official logos.
  switch (platform) {
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" width="60%" height="60%" aria-hidden>
          <rect x="2" y="6" width="20" height="12" rx="3" fill="#fff" />
          <path d="M10 9.5v5l4.5-2.5z" fill={PLATFORMS.youtube.color} />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" width="55%" height="55%" aria-hidden>
          <path
            d="M14 3v9.2a2.8 2.8 0 1 1-2.8-2.8h.8V7a5.6 5.6 0 1 0 5.6 5.6V8.8c1.1.7 2.3 1.1 3.4 1.1V7c-2 0-3.7-1-4.6-2.4l-.2-.3-.2-.3z"
            fill="#fff"
          />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" width="60%" height="60%" aria-hidden>
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="5"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
          />
          <circle cx="12" cy="12" r="4" fill="none" stroke="#fff" strokeWidth="2" />
          <circle cx="17" cy="7" r="1.2" fill="#fff" />
        </svg>
      );
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" width="55%" height="55%" aria-hidden>
          <path
            d="M13 22v-8h2.5l.5-3H13V9.2c0-.9.3-1.5 1.6-1.5H16V5.1c-.3 0-1.4-.1-2.5-.1-2.5 0-4 1.5-4 4.2V11H7v3h2.5v8H13z"
            fill="#fff"
          />
        </svg>
      );
    case "amazon_shop":
      return (
        <svg viewBox="0 0 24 24" width="62%" height="62%" aria-hidden>
          {/* Bag */}
          <path
            d="M5 8h14l-1 11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 8z"
            fill="#fff"
          />
          <path
            d="M9 8V6a3 3 0 0 1 6 0v2"
            fill="none"
            stroke={PLATFORMS.amazon_shop.color}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "amazon_live": {
      const c = PLATFORMS.amazon_live.color;
      return (
        <svg viewBox="0 0 24 24" width="62%" height="62%" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="#fff" />
          <path d="M10 8v8l6-4z" fill={c} />
          <circle cx="19" cy="6" r="2.5" fill="#FF3B30" />
        </svg>
      );
    }
    case "ugc":
      // Bold "UGC" wordmark on the gradient bubble — distinctive and unambiguous.
      return (
        <svg viewBox="0 0 24 24" width="80%" height="80%" aria-hidden>
          <text
            x="12"
            y="16"
            fill="#fff"
            fontSize="8"
            fontWeight="800"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="-0.3"
          >
            UGC
          </text>
        </svg>
      );
  }
}

export default function PlatformIcon({ platform, size = 32, className = "" }: Props) {
  const cfg = PLATFORMS[platform];
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
      <Inner platform={platform} />
    </span>
  );
}
