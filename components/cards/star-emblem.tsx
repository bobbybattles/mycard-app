// Creator Star Level emblems.
// Renders one of four metallic gradient shapes with a five-point star inside,
// matching the Bronze / Silver / Gold / Platinum reference layout.

export type StarLevel = "bronze" | "silver" | "gold" | "platinum";

const LEVEL_LABELS: Record<StarLevel, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

// Returns the d= path for a regular polygon with n sides, centered at (cx, cy)
// of radius r. rotationDeg = 0 puts the first vertex straight up.
function polygonPath(cx: number, cy: number, r: number, n: number, rotationDeg = 0) {
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const angle = ((i / n) * 2 * Math.PI) + (rotationDeg * Math.PI) / 180 - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(" ");
}

// Standard five-point star, centered at (cx, cy) with outer radius r.
function starPath(cx: number, cy: number, r: number) {
  const inner = r * 0.382; // golden ratio for a clean star
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * 2 * Math.PI - Math.PI / 2;
    const radius = i % 2 === 0 ? r : inner;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(" ");
}

type Props = {
  level: StarLevel;
  /** Total pixel size of the emblem (square). Defaults to 64. */
  size?: number;
  /** When true, the level name is rendered below the emblem. */
  showLabel?: boolean;
  className?: string;
};

// Emblem visual configuration per level: shape, gradient stops, star color.
type Variant = {
  shape: { kind: "polygon"; sides: number; rotation?: number };
  gradient: { id: string; stops: { offset: string; color: string }[] };
  starFill: string;
};

const VARIANTS: Record<StarLevel, Variant> = {
  bronze: {
    shape: { kind: "polygon", sides: 4, rotation: 0 }, // diamond
    gradient: {
      id: "bronze-grad",
      stops: [
        { offset: "0%", color: "#f7c8a3" },
        { offset: "40%", color: "#cf7a44" },
        { offset: "70%", color: "#a85a2a" },
        { offset: "100%", color: "#6b3214" },
      ],
    },
    starFill: "#ffffff",
  },
  silver: {
    shape: { kind: "polygon", sides: 5, rotation: 0 }, // pentagon
    gradient: {
      id: "silver-grad",
      stops: [
        { offset: "0%", color: "#f9fafb" },
        { offset: "35%", color: "#d1d5db" },
        { offset: "70%", color: "#94a3b8" },
        { offset: "100%", color: "#64748b" },
      ],
    },
    starFill: "#0f2042",
  },
  gold: {
    shape: { kind: "polygon", sides: 6, rotation: 0 }, // hexagon, point up
    gradient: {
      id: "gold-grad",
      stops: [
        { offset: "0%", color: "#fff5c2" },
        { offset: "40%", color: "#f6c350" },
        { offset: "75%", color: "#e09b2f" },
        { offset: "100%", color: "#a86a12" },
      ],
    },
    starFill: "#e0532a",
  },
  platinum: {
    shape: { kind: "polygon", sides: 10, rotation: 0 }, // decagon
    gradient: {
      id: "platinum-grad",
      stops: [
        { offset: "0%", color: "#fee4f7" },
        { offset: "30%", color: "#c6e6ff" },
        { offset: "60%", color: "#e2d4ff" },
        { offset: "100%", color: "#cbb8f8" },
      ],
    },
    starFill: "#7c3aed",
  },
};

export default function StarEmblem({
  level,
  size = 64,
  showLabel = false,
  className = "",
}: Props) {
  const variant = VARIANTS[level];
  const cx = 50;
  const cy = 50;
  const shapeRadius = 44;
  const starRadius = 18;

  const polygonPoints =
    variant.shape.kind === "polygon"
      ? polygonPath(cx, cy, shapeRadius, variant.shape.sides, variant.shape.rotation ?? 0)
      : "";

  return (
    <span className={`inline-flex flex-col items-center ${className}`}>
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        role="img"
        aria-label={`${LEVEL_LABELS[level]} Creator badge`}
      >
        <defs>
          <radialGradient
            id={variant.gradient.id}
            cx="35%"
            cy="30%"
            r="80%"
          >
            {variant.gradient.stops.map((stop, i) => (
              <stop
                key={i}
                offset={stop.offset}
                stopColor={stop.color}
              />
            ))}
          </radialGradient>
          <filter id={`${variant.gradient.id}-shadow`} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodOpacity="0.18" />
          </filter>
        </defs>
        <polygon
          points={polygonPoints}
          fill={`url(#${variant.gradient.id})`}
          filter={`url(#${variant.gradient.id}-shadow)`}
        />
        <polygon
          points={starPath(cx, cy, starRadius)}
          fill={variant.starFill}
        />
      </svg>
      {showLabel && (
        <span className="mt-1 text-xs font-semibold text-slate-900">
          {LEVEL_LABELS[level]}
        </span>
      )}
    </span>
  );
}

export { LEVEL_LABELS };
