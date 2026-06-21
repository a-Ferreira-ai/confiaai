export const GEOFENCE_RADIUS_M = 100;
export const GEOFENCE_DEBOUNCE_MS = 30 * 60 * 1000;
export const GEOFENCE_DWELL_MS = 5 * 60 * 1000;
const PROMPT_STORAGE_KEY = "confia_geofence_prompted";

export type GeofencePromptKind = "arrival" | "boarding" | "dwell";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GeofenceStop {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
}

export interface GeofencePromptEvent {
  stop: GeofenceStop;
  kind: GeofencePromptKind;
}

export interface TrackGeofenceContextOptions {
  stops: GeofenceStop[];
  /** When set, only prompt when the nearest stop matches this id. */
  filterStopId?: number;
  /** Kind used before dwell threshold is reached. */
  defaultKind?: GeofencePromptKind;
  onPrompt: (event: GeofencePromptEvent) => void;
}

const EARTH_RADIUS_KM = 6371;

export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 1000;
}

export function nearestStop(
  position: GeoPoint,
  stops: GeofenceStop[],
  radiusM = GEOFENCE_RADIUS_M,
): GeofenceStop | null {
  let nearest: GeofenceStop | null = null;
  let minDistance = radiusM;

  for (const stop of stops) {
    const dist = distanceMeters(position, {
      lat: parseFloat(stop.latitude),
      lng: parseFloat(stop.longitude),
    });
    if (dist <= minDistance) {
      minDistance = dist;
      nearest = stop;
    }
  }

  return nearest;
}

function readPromptedMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(PROMPT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function writePromptedMap(map: Record<string, number>): void {
  localStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(map));
}

export function wasRecentlyPrompted(stopId: number): boolean {
  const map = readPromptedMap();
  const last = map[String(stopId)];
  if (!last) return false;
  return Date.now() - last < GEOFENCE_DEBOUNCE_MS;
}

export function markPrompted(stopId: number): void {
  const map = readPromptedMap();
  map[String(stopId)] = Date.now();
  writePromptedMap(map);
}

function detectPromptKind(
  stopId: number,
  defaultKind: GeofencePromptKind,
  dwellAnchor: { stopId: number; since: number } | null,
): GeofencePromptKind {
  if (
    dwellAnchor?.stopId === stopId &&
    Date.now() - dwellAnchor.since >= GEOFENCE_DWELL_MS
  ) {
    return "dwell";
  }

  return defaultKind;
}

export function trackGeofenceContext(options: TrackGeofenceContextOptions): () => void {
  const { stops, filterStopId, defaultKind = "arrival", onPrompt } = options;

  if (!navigator.geolocation) return () => {};

  let dwellAnchor: { stopId: number; since: number } | null = null;
  let lastEventKey: string | null = null;

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const point: GeoPoint = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      const stop = nearestStop(point, stops);

      if (!stop) {
        dwellAnchor = null;
        lastEventKey = null;
        return;
      }

      if (filterStopId !== undefined && stop.id !== filterStopId) {
        dwellAnchor = null;
        lastEventKey = null;
        return;
      }

      if (wasRecentlyPrompted(stop.id)) return;

      if (dwellAnchor?.stopId === stop.id) {
        // keep existing anchor
      } else {
        dwellAnchor = { stopId: stop.id, since: Date.now() };
      }

      const kind = detectPromptKind(stop.id, defaultKind, dwellAnchor);
      const eventKey = `${stop.id}:${kind}`;

      if (lastEventKey === eventKey) return;

      lastEventKey = eventKey;
      onPrompt({ stop, kind });
    },
    () => {},
    { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
  );

  return () => navigator.geolocation.clearWatch(watchId);
}

/** @deprecated Prefer trackGeofenceContext for contextual prompts. */
export function watchNearStop(
  stops: GeofenceStop[],
  onEnter: (stop: GeofenceStop) => void,
): () => void {
  return trackGeofenceContext({
    stops,
    defaultKind: "arrival",
    onPrompt: ({ stop }) => onEnter(stop),
  });
}
