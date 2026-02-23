import { formatTime } from "@/lib/utils";
import type { BestEffort } from "@/utils/types/activities";
import { TrendingUp, TrophyIcon } from "lucide-react";

const BEST_EFFORT_TARGET_DISTANCES_METERS = [
  400, 1000, 1609.344, 5000, 10000, 21097.5, 42195,
] as const;

const DISTANCE_CONFIG: Record<
  number,
  {
    short: string;
    long: string;
    color: string;
    ring: string;
    glow: string;
  }
> = {
  400: {
    short: "400m",
    long: "400 Meters",
    color: "#6b7280",
    ring: "#9ca3af",
    glow: "rgba(156,163,175,0.3)",
  },
  1000: {
    short: "1K",
    long: "1 Kilometer",
    color: "#475569",
    ring: "#94a3b8",
    glow: "rgba(148,163,184,0.3)",
  },
  1609.344: {
    short: "1MI",
    long: "1 Mile",
    color: "#92400e",
    ring: "#f59e0b",
    glow: "rgba(245,158,11,0.3)",
  },
  5000: {
    short: "5K",
    long: "5 Kilometers",
    color: "#1e40af",
    ring: "#60a5fa",
    glow: "rgba(96,165,250,0.3)",
  },
  10000: {
    short: "10K",
    long: "10 Kilometers",
    color: "#065f46",
    ring: "#34d399",
    glow: "rgba(52,211,153,0.3)",
  },
  21097.5: {
    short: "HM",
    long: "Half Marathon",
    color: "#5b21b6",
    ring: "#a78bfa",
    glow: "rgba(167,139,250,0.3)",
  },
  42195: {
    short: "FM",
    long: "Full Marathon",
    color: "#7f1d1d",
    ring: "#f87171",
    glow: "rgba(248,113,113,0.3)",
  },
};

function formatPace(distanceMeters: number, durationSeconds: number): string {
  const paceSecondsPerKm = durationSeconds / (distanceMeters / 1000);
  const m = Math.floor(paceSecondsPerKm / 60);
  const s = Math.floor(paceSecondsPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}/km`;
}

type MedalProps = {
  label: string;
  color: string;
  ring: string;
  glow: string;
};

function Medal({ label, color, ring, glow }: MedalProps) {
  const uid = `medal-${label.replace(/\W/g, "")}`;
  const fontSize = label.length > 2 ? 17 : 21;

  return (
    <svg
      viewBox="0 0 80 80"
      className="h-14 w-14 transition-all duration-300"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`bg-${uid}`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={`${color}cc`} stopOpacity="1" />
        </radialGradient>
        <filter id={`glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer glow ring */}
      <circle
        cx="40"
        cy="40"
        r="37"
        fill="none"
        stroke={glow}
        strokeWidth="6"
      />

      {/* Main ring */}
      <circle
        cx="40"
        cy="40"
        r="34"
        fill="none"
        stroke={ring}
        strokeWidth="2.5"
      />

      {/* Coin body */}
      <circle cx="40" cy="40" r="31" fill={`url(#bg-${uid})`} />

      {/* Inner detail ring */}
      <circle
        cx="40"
        cy="40"
        r="26"
        fill="none"
        stroke={ring}
        strokeWidth="0.75"
        strokeOpacity="0.5"
      />

      {/* Label */}
      <text
        x="40"
        y="41"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={fontSize}
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
        letterSpacing="-0.5"
      >
        {label}
      </text>
    </svg>
  );
}

type BestEffortsProps = {
  efforts: BestEffort[];
};

export function BestEfforts({ efforts }: BestEffortsProps) {
  const effortsByDistance = new Map(
    efforts.map((e) => [e.targetDistanceMeters, e]),
  );

  const hasAnyEffort = efforts.length > 0;

  return (
    <div>
      <p className="text-muted-foreground mb-6 flex items-center gap-2 text-xs font-medium tracking-widest uppercase">
        <TrophyIcon className="size-4 text-yellow-500" />
        Best Efforts
      </p>

      {!hasAnyEffort ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
          <TrendingUp className="h-8 w-8 opacity-40" />
          <p className="text-sm">
            No best efforts recorded yet. Complete some activities to see your
            records here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4">
          {BEST_EFFORT_TARGET_DISTANCES_METERS.map((distance) => {
            const effort = effortsByDistance.get(distance);
            const config = DISTANCE_CONFIG[distance];

            if (!effort) {
              return null;
            }

            return (
              <div
                key={distance}
                className="flex flex-col items-center gap-1.5"
              >
                <Medal
                  label={config.short}
                  color={config.color}
                  ring={config.ring}
                  glow={config.glow}
                />
                <span className="font-mono text-sm leading-tight font-semibold tabular-nums">
                  {formatTime(effort.durationSeconds)}
                </span>
                <span className="text-muted-foreground font-mono text-xs tabular-nums">
                  {formatPace(distance, effort.durationSeconds)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
