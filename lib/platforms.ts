// Definitions for the six supported platforms across the Portfolio card and
// the Profile card's "Platforms" list. Each platform carries display
// metadata, brand color, embed support flag, and a URL detector.

export type Platform =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "facebook"
  | "amazon_shop"
  | "amazon_live";

export type PlatformConfig = {
  id: Platform;
  /** Display name as shown on the kit + editor headings. */
  label: string;
  /** Short label for badges. */
  shortLabel: string;
  /** Brand-ish color used for icons + accents. */
  color: string;
  /** Background gradient for the platform tile/icon bubble. */
  gradient: { from: string; to: string };
  /** True if we can play this source inline (rather than redirect on click). */
  canEmbed: boolean;
  /** Whether the URL pattern is recognized by detectPlatform(). */
  urlHint: string;
};

export const PLATFORMS: Record<Platform, PlatformConfig> = {
  youtube: {
    id: "youtube",
    label: "YouTube",
    shortLabel: "YouTube",
    color: "#FF0000",
    gradient: { from: "#FF4D4D", to: "#CC0000" },
    canEmbed: true,
    urlHint: "youtube.com/... or youtu.be/...",
  },
  tiktok: {
    id: "tiktok",
    label: "TikTok",
    shortLabel: "TikTok",
    color: "#111111",
    gradient: { from: "#25F4EE", to: "#FE2C55" },
    canEmbed: false,
    urlHint: "tiktok.com/@user/video/...",
  },
  instagram: {
    id: "instagram",
    label: "Instagram",
    shortLabel: "Instagram",
    color: "#E1306C",
    gradient: { from: "#F09433", to: "#BC1888" },
    canEmbed: false,
    urlHint: "instagram.com/p/... or /reel/...",
  },
  facebook: {
    id: "facebook",
    label: "Facebook",
    shortLabel: "Facebook",
    color: "#1877F2",
    gradient: { from: "#4267B2", to: "#1877F2" },
    canEmbed: false,
    urlHint: "facebook.com/... or fb.watch/...",
  },
  amazon_shop: {
    id: "amazon_shop",
    label: "Amazon Shop",
    shortLabel: "Amazon",
    color: "#FF9900",
    gradient: { from: "#FFB84D", to: "#FF9900" },
    canEmbed: false,
    urlHint: "amazon.com/shop/...",
  },
  amazon_live: {
    id: "amazon_live",
    label: "Amazon Live",
    shortLabel: "Amazon Live",
    color: "#232F3E",
    gradient: { from: "#FF9900", to: "#232F3E" },
    canEmbed: true,
    urlHint: "amazon.com/vdp/... or amazon.com/live/...",
  },
};

/** Preferred order for "Add a platform" dropdowns and grouped renders. */
export const PLATFORM_ORDER: Platform[] = [
  "youtube",
  "amazon_live",
  "amazon_shop",
  "tiktok",
  "instagram",
  "facebook",
];

/** Detect the platform a URL belongs to. Falls back to "youtube" only when
 *  we can't tell — callers should treat null as "unknown". */
export function detectPlatform(url: string): Platform | null {
  if (!url) return null;
  const u = url.toLowerCase();
  if (/(?:youtube\.com|youtu\.be)/.test(u)) return "youtube";
  if (/tiktok\.com/.test(u)) return "tiktok";
  if (/instagram\.com/.test(u)) return "instagram";
  if (/(?:facebook\.com|fb\.watch)/.test(u)) return "facebook";
  if (/amazon\.[a-z.]+\/(?:vdp|live)/.test(u)) return "amazon_live";
  if (/amazon\.[a-z.]+\/shop/.test(u)) return "amazon_shop";
  if (/amazon\./.test(u) || /amzn\.to/.test(u)) return "amazon_shop";
  return null;
}
