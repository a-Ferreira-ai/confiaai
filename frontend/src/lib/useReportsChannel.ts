import { useEffect, useRef } from "react";
import { subscribeToReports } from "./cable";
import type { ReportBroadcast } from "./types";

export interface UseReportsChannelOptions {
  stopId?: number | string;
  tripId?: number | string;
  onReport?: (payload: ReportBroadcast) => void;
}

function matchesFilter(
  payload: ReportBroadcast,
  stopId?: number | string,
  tripId?: number | string,
): boolean {
  if (stopId !== undefined && Number(payload.stop_id) !== Number(stopId)) {
    return false;
  }
  if (tripId !== undefined && payload.trip_id !== undefined) {
    return Number(payload.trip_id) === Number(tripId);
  }
  if (tripId !== undefined && payload.trip_id === undefined) {
    return false;
  }
  return true;
}

export function useReportsChannel({
  stopId,
  tripId,
  onReport,
}: UseReportsChannelOptions): void {
  const callbackRef = useRef(onReport);
  callbackRef.current = onReport;

  useEffect(() => {
    return subscribeToReports((payload) => {
      if (!matchesFilter(payload, stopId, tripId)) return;
      callbackRef.current?.(payload);
    });
  }, [stopId, tripId]);
}
