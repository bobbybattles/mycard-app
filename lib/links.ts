// Unified "link" type for the Connections card. A single link can be any of
// the six platforms (YouTube, TikTok, Instagram, Facebook, Amazon Shop, Amazon
// Live) or the six social types (X, LinkedIn, Pinterest, Threads, Snapchat,
// Website). The Connections card stores one flat list of these.

import { PLATFORMS, PLATFORM_ORDER, type Platform } from "./platforms";
import { SOCIALS, SOCIAL_ORDER, type SocialType } from "./socials";

export type LinkType = Platform | SocialType;

export type ProfileLink = {
  id: string;
  type: LinkType;
  /** Optional label (e.g. "Main channel", "Personal blog"). */
  label?: string;
  url: string;
};

export type LinksCardData = {
  links: ProfileLink[];
};

/** Pick order for the unified "Add a link" picker — platforms first, then socials. */
export const LINK_TYPE_ORDER: LinkType[] = [
  ...PLATFORM_ORDER,
  ...SOCIAL_ORDER,
];

const PLATFORM_KEYS = new Set<LinkType>(PLATFORM_ORDER);

/** True if this LinkType is one of the video-source platforms. */
export function isPlatformType(type: LinkType): type is Platform {
  return PLATFORM_KEYS.has(type);
}

/** Display label + short label + URL hint for any LinkType. */
export function getLinkTypeConfig(type: LinkType): {
  label: string;
  shortLabel: string;
  urlHint: string;
} {
  if (isPlatformType(type)) {
    const cfg = PLATFORMS[type];
    return { label: cfg.label, shortLabel: cfg.shortLabel, urlHint: cfg.urlHint };
  }
  const cfg = SOCIALS[type];
  return { label: cfg.label, shortLabel: cfg.shortLabel, urlHint: cfg.urlHint };
}
