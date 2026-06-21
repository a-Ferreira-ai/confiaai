import { fetchStop, fetchStops } from "./api";
import { distanceMeters } from "./geofence";
import type { SafetyLevel, StopDetail, StopSummary } from "./types";

const SAFER_STOP_RADIUS_M = 800;
const MAX_CANDIDATES = 5;

const SAFETY_RANK: Record<SafetyLevel | "no_data", number> = {
  high: 3,
  medium: 2,
  low: 1,
  no_data: 0,
};

export interface SaferStopSuggestion {
  id: number;
  name: string;
}

function isStrictlySafer(
  candidateLevel: SafetyLevel | "no_data",
  currentLevel: SafetyLevel | "no_data",
): boolean {
  return SAFETY_RANK[candidateLevel] > SAFETY_RANK[currentLevel];
}

function nearestCandidates(
  stop: StopDetail,
  stops: StopSummary[],
): StopSummary[] {
  const origin = {
    lat: parseFloat(stop.latitude),
    lng: parseFloat(stop.longitude),
  };

  return stops
    .filter((candidate) => candidate.id !== stop.id && candidate.mode === stop.mode)
    .map((candidate) => ({
      candidate,
      distance: distanceMeters(origin, {
        lat: parseFloat(candidate.latitude),
        lng: parseFloat(candidate.longitude),
      }),
    }))
    .filter(({ distance }) => distance <= SAFER_STOP_RADIUS_M)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, MAX_CANDIDATES)
    .map(({ candidate }) => candidate);
}

export async function findNearbySaferStop(
  stop: StopDetail,
): Promise<SaferStopSuggestion | null> {
  if (stop.safety.level !== "low") return null;

  const { stops } = await fetchStops(stop.mode);
  const candidates = nearestCandidates(stop, stops);
  if (candidates.length === 0) return null;

  const details = await Promise.all(
    candidates.map((candidate) =>
      fetchStop(candidate.id).catch(() => null),
    ),
  );

  let best: StopDetail | null = null;

  for (const detail of details) {
    if (!detail) continue;
    if (!isStrictlySafer(detail.safety.level, stop.safety.level)) continue;

    if (
      !best ||
      SAFETY_RANK[detail.safety.level] > SAFETY_RANK[best.safety.level]
    ) {
      best = detail;
    }
  }

  return best ? { id: best.id, name: best.name } : null;
}
