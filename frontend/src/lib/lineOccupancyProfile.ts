import type { TransportMode } from "./types";

export interface OccupancyHourBucket {
  hour: number;
  label: string;
  intensity: number;
}

const HOUR_LABELS = [
  "5h",
  "7h",
  "9h",
  "11h",
  "13h",
  "15h",
  "17h",
  "19h",
  "21h",
] as const;

const HOUR_VALUES = [5, 7, 9, 11, 13, 15, 17, 19, 21] as const;

function hashSeed(lineId: number, mode: TransportMode): number {
  const modeOffset = mode === "metro" ? 17 : mode === "bus" ? 7 : 0;
  return (lineId * 31 + modeOffset) % 997;
}

function peakHour(mode: TransportMode, seed: number): number {
  if (mode === "metro") {
    return HOUR_VALUES[(seed % 3) + 3];
  }
  return HOUR_VALUES[(seed % 4) + 4];
}

function intensityForHour(hour: number, peak: number, seed: number): number {
  const distance = Math.abs(hour - peak);
  const base = Math.max(0.12, 1 - distance * 0.18);
  const jitter = ((seed + hour * 13) % 11) / 100;
  return Math.min(1, Math.max(0.1, base + jitter - 0.05));
}

export function buildLineOccupancyProfile(
  lineId: number,
  mode: TransportMode,
): OccupancyHourBucket[] {
  const seed = hashSeed(lineId, mode);
  const peak = peakHour(mode, seed);

  return HOUR_VALUES.map((hour, index) => ({
    hour,
    label: HOUR_LABELS[index],
    intensity: intensityForHour(hour, peak, seed),
  }));
}
