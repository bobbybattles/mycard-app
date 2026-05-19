// Design themes for the public kit. Each theme is a totally different page
// layout — not just a color swap. Stored on kits.theme.design.

export type DesignId =
  | "classic"
  | "magazine"
  | "minimal"
  | "neon"
  | "sunset";

export type DesignConfig = {
  id: DesignId;
  /** Display name shown in the design picker. */
  name: string;
  /** Short one-liner shown under the name. */
  tagline: string;
  /** Preview color/gradient strings used by the picker swatch. */
  previewBg: string;
  /** Tiny accent color shown alongside the swatch. */
  previewAccent: string;
};

export const DESIGNS: Record<DesignId, DesignConfig> = {
  classic: {
    id: "classic",
    name: "Classic",
    tagline: "Soft pink gradient · centered",
    previewBg: "linear-gradient(180deg, #fce7f3 0%, #ffffff 60%)",
    previewAccent: "#ec4899",
  },
  magazine: {
    id: "magazine",
    name: "Magazine",
    tagline: "Editorial split · bold serif",
    previewBg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #ffffff 100%)",
    previewAccent: "#111827",
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    tagline: "Pure white · oversized stats",
    previewBg: "#ffffff",
    previewAccent: "#0f172a",
  },
  neon: {
    id: "neon",
    name: "Neon",
    tagline: "Dark glass · neon accents",
    previewBg: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #4c1d95 100%)",
    previewAccent: "#22d3ee",
  },
  sunset: {
    id: "sunset",
    name: "Sunset",
    tagline: "Warm orange · asymmetric",
    previewBg: "linear-gradient(135deg, #fb923c 0%, #f472b6 60%, #c026d3 100%)",
    previewAccent: "#9a3412",
  },
};

export const DESIGN_ORDER: DesignId[] = [
  "classic",
  "magazine",
  "minimal",
  "neon",
  "sunset",
];

/** Read the design id from kit.theme jsonb. Defaults to "classic". */
export function getDesign(theme: Record<string, unknown> | null | undefined): DesignId {
  const raw = theme?.design;
  if (typeof raw === "string" && raw in DESIGNS) return raw as DesignId;
  return "classic";
}
