import { fetchOccupancy } from "./api";
import type {
  Occupancy,
  OccupancyLevel,
  Reliability,
  ReliabilityLevel,
  RouteLeg,
  RouteOption,
} from "./types";

const RELIABILITY_RANK: Record<ReliabilityLevel, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const OCCUPANCY_RANK: Record<OccupancyLevel, number> = {
  free: 0,
  moderate: 1,
  crowded: 2,
  packed: 3,
};

const DETOUR_MINUTES_THRESHOLD = 5;

export const NO_DATA_OCCUPANCY: Occupancy = {
  level: "moderate",
  label: "ocupação desconhecida",
  sample_size: 0,
  source: null,
  source_label: null,
  recorded_at: null,
};

export const NO_DATA_RELIABILITY: Reliability = {
  level: "medium",
  label: "confiança em construção",
  sample_size: 0,
  median_delay_seconds: null,
  on_time_percent: null,
};

export function formatRouteTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function routeHasMetro(legs: RouteLeg[]): boolean {
  return legs.some((leg) => leg.leg_type === "transit" && leg.mode === "metro");
}

export function modeIconsForLegs(legs: RouteLeg[]): string {
  return legs
    .map((leg) => {
      if (leg.leg_type === "transfer") return "🚶";
      if (leg.mode === "bus") return "🚌";
      if (leg.mode === "metro") return "🚇";
      return "🚶";
    })
    .join("");
}

export function worstReliabilityFromLegs(legs: RouteLeg[]): Reliability {
  const withData = legs.filter((leg) => leg.reliability && leg.reliability.sample_size > 0);
  if (withData.length === 0) {
    const fallback = legs.find((leg) => leg.reliability)?.reliability;
    return fallback ?? NO_DATA_RELIABILITY;
  }

  const worst = withData.reduce((current, candidate) => {
    const currentRank = RELIABILITY_RANK[current.reliability!.level];
    const candidateRank = RELIABILITY_RANK[candidate.reliability!.level];
    return candidateRank >= currentRank ? candidate : current;
  });

  return worst.reliability!;
}

export function pickFullestOccupancy(occupancies: Occupancy[]): Occupancy {
  const withData = occupancies.filter((occupancy) => occupancy.sample_size > 0);
  if (withData.length === 0) return NO_DATA_OCCUPANCY;

  return withData.reduce((current, candidate) => {
    const currentRank = OCCUPANCY_RANK[current.level as OccupancyLevel];
    const candidateRank = OCCUPANCY_RANK[candidate.level as OccupancyLevel];
    return candidateRank >= currentRank ? candidate : current;
  });
}

export function sortRoutesByLeaveAt(routes: RouteOption[]): RouteOption[] {
  return [...routes].sort(
    (left, right) => new Date(left.leave_at).getTime() - new Date(right.leave_at).getTime(),
  );
}

export function hasUnnecessaryDetour(routes: RouteOption[], routeIndex: number): boolean {
  const route = routes.find((item) => item.route_index === routeIndex);
  if (!route || route.route_type !== "transfer") return false;

  const directRoutes = routes.filter((item) => item.route_type === "direct");
  if (directRoutes.length === 0) return false;

  const minDirectMinutes = Math.min(...directRoutes.map((item) => item.total_minutes));
  return route.total_minutes >= minDirectMinutes + DETOUR_MINUTES_THRESHOLD;
}

export function transitLegs(route: RouteOption): RouteLeg[] {
  return route.legs.filter((leg) => leg.leg_type === "transit");
}

export function firstTransitLeg(route: RouteOption): RouteLeg | null {
  return route.legs.find((leg) => leg.leg_type === "transit") ?? null;
}

export async function enrichRouteOccupancy(route: RouteOption): Promise<Occupancy> {
  const legs = transitLegs(route);
  if (legs.length === 0) return NO_DATA_OCCUPANCY;

  const occupancies = await Promise.all(
    legs.map((leg) =>
      fetchOccupancy(leg.from_stop.id, leg.trip_id ?? undefined)
        .then((response) => response.occupancy)
        .catch(() => NO_DATA_OCCUPANCY),
    ),
  );

  return pickFullestOccupancy(occupancies);
}

export function buildRouteListUrl(params: {
  origin: string;
  destination: string;
  modeFilter?: string;
}): string {
  const query = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
  });
  if (params.modeFilter) {
    query.set("mode_filter", params.modeFilter);
  }
  return `/rota?${query.toString()}`;
}

export function buildRouteDetailUrl(params: {
  origin: string;
  destination: string;
  routeIndex: number;
  modeFilter?: string;
}): string {
  const query = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    route_index: String(params.routeIndex),
  });
  if (params.modeFilter) {
    query.set("mode_filter", params.modeFilter);
  }
  return `/rota?${query.toString()}`;
}
