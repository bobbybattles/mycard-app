// Definitions for the "Social profiles" list on the Profile card editor.
// These are general find-me links — distinct from the "Platforms" list which
// is used to source videos for the Portfolio card.

export type SocialType =
  | "x"
  | "linkedin"
  | "pinterest"
  | "threads"
  | "snapchat"
  | "website";

export type SocialConfig = {
  id: SocialType;
  label: string;
  shortLabel: string;
  color: string;
  gradient: { from: string; to: string };
  urlHint: string;
};

export const SOCIALS: Record<SocialType, SocialConfig> = {
  x: {
    id: "x",
    label: "X (Twitter)",
    shortLabel: "X",
    color: "#000000",
    gradient: { from: "#1a1a1a", to: "#000000" },
    urlHint: "x.com/yourhandle",
  },
  linkedin: {
    id: "linkedin",
    label: "LinkedIn",
    shortLabel: "LinkedIn",
    color: "#0a66c2",
    gradient: { from: "#0a66c2", to: "#004182" },
    urlHint: "linkedin.com/in/yourhandle",
  },
  pinterest: {
    id: "pinterest",
    label: "Pinterest",
    shortLabel: "Pinterest",
    color: "#bd081c",
    gradient: { from: "#e60023", to: "#8a0612" },
    urlHint: "pinterest.com/yourhandle",
  },
  threads: {
    id: "threads",
    label: "Threads",
    shortLabel: "Threads",
    color: "#000000",
    gradient: { from: "#222222", to: "#000000" },
    urlHint: "threads.net/@yourhandle",
  },
  snapchat: {
    id: "snapchat",
    label: "Snapchat",
    shortLabel: "Snapchat",
    color: "#fffc00",
    gradient: { from: "#fffc00", to: "#f5d300" },
    urlHint: "snapchat.com/add/yourhandle",
  },
  website: {
    id: "website",
    label: "Website / Blog",
    shortLabel: "Website",
    color: "#0ea5e9",
    gradient: { from: "#06b6d4", to: "#3b82f6" },
    urlHint: "yourdomain.com",
  },
};

export const SOCIAL_ORDER: SocialType[] = [
  "x",
  "linkedin",
  "pinterest",
  "threads",
  "snapchat",
  "website",
];
