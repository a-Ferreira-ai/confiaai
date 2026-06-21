import { fetchOccupancy } from "./api";
import { NO_DATA_OCCUPANCY } from "./routeHelpers";
import type { Occupancy, StopDetail, StopLineSummary, StopTripRef } from "./types";

export interface LineAtStopEnriched {
  line: StopLineSummary;
  nextDeparture: string | null;
  occupancy: Occupancy;
}

export function nextTripForLine(
  trips: StopTripRef[],
  lineId: number,
): StopTripRef | null {
  const lineTrips = trips.filter((trip) => trip.line_id === lineId);
  if (lineTrips.length === 0) return null;

  const now = Date.now();
  const upcoming = lineTrips
    .filter((trip) => trip.scheduled_at && new Date(trip.scheduled_at).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime(),
    );

  if (upcoming.length > 0) return upcoming[0];

  const sorted = [...lineTrips].sort(
    (a, b) =>
      new Date(b.scheduled_at ?? 0).getTime() - new Date(a.scheduled_at ?? 0).getTime(),
  );
  return sorted[0] ?? null;
}

export function formatNextDeparture(scheduledAt: string | null): string | null {
  if (!scheduledAt) return null;

  return new Date(scheduledAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function enrichLinesAtStop(stop: StopDetail): Promise<LineAtStopEnriched[]> {
  return Promise.all(
    stop.lines.map(async (line) => {
      const trip = nextTripForLine(stop.trips, line.id);
      const nextDeparture = formatNextDeparture(trip?.scheduled_at ?? null);

      let occupancy = NO_DATA_OCCUPANCY;
      if (trip) {
        occupancy = await fetchOccupancy(stop.id, trip.id)
          .then((response) => response.occupancy)
          .catch(() => NO_DATA_OCCUPANCY);
      }

      return { line, nextDeparture, occupancy };
    }),
  );
}
