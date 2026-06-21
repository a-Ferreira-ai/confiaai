import { fetchLine, fetchOccupancy, fetchStop } from "./api";
import type { FavoriteItem } from "./favoritos";
import type { Occupancy, Reliability, TransportMode } from "./types";

export interface EnrichedFavorite {
  item: FavoriteItem;
  reliability: Reliability | null;
  occupancy: Occupancy | null;
  error: boolean;
}

export function modeIcon(mode?: FavoriteItem["mode"]): string {
  if (mode === "metro") return "🚇";
  if (mode === "bus") return "🚌";
  return "📍";
}

export async function enrichFavorite(item: FavoriteItem): Promise<EnrichedFavorite> {
  try {
    if (item.kind === "stop") {
      const [stop, occupancyData] = await Promise.all([
        fetchStop(item.id),
        fetchOccupancy(item.id),
      ]);
      return {
        item,
        reliability: stop.reliability,
        occupancy: occupancyData.occupancy,
        error: false,
      };
    }

    const line = await fetchLine(item.id);
    return {
      item,
      reliability: line.reliability,
      occupancy: null,
      error: false,
    };
  } catch {
    return { item, reliability: null, occupancy: null, error: true };
  }
}

export interface EnrichedRecent {
  originId: number;
  originName: string;
  destinationId: number;
  destinationName: string;
  modeFilter: TransportMode | "";
  reliability: Reliability | null;
  occupancy: Occupancy | null;
  error: boolean;
}

export async function enrichRecent(entry: {
  originId: number;
  originName: string;
  destinationId: number;
  destinationName: string;
  modeFilter: TransportMode | "";
}): Promise<EnrichedRecent> {
  try {
    const [originStop, occupancyData] = await Promise.all([
      fetchStop(entry.originId),
      fetchOccupancy(entry.originId),
    ]);
    return {
      ...entry,
      reliability: originStop.reliability,
      occupancy: occupancyData.occupancy,
      error: false,
    };
  } catch {
    return {
      ...entry,
      reliability: null,
      occupancy: null,
      error: true,
    };
  }
}
