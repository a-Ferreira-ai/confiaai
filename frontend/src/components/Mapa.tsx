import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { LatLngExpression } from "leaflet";
import { MAP_DESTINATION_COLOR, MAP_ORIGIN_COLOR, reliabilityPinColor } from "../lib/pillarStyles";
import type { Reliability } from "../lib/types";

export type MapMarkerVariant = "default" | "origin" | "destination" | "bus" | "metro";

export interface MapMarker {
  id: string | number;
  lat: number;
  lng: number;
  label: string;
  variant?: MapMarkerVariant;
  intensity?: number;
  reliability?: Reliability;
}

export interface UserPosition {
  lat: number;
  lng: number;
}

export interface MapaProps {
  markers: MapMarker[];
  center?: LatLngExpression;
  zoom?: number;
  className?: string;
  fitBounds?: boolean;
  userPosition?: UserPosition | null;
}

const DEMO_CENTER: LatLngExpression = [-15.84, -48.08];
const DEFAULT_ZOOM = 12;

const MARKER_COLORS: Record<MapMarkerVariant, string> = {
  default: "#5B7079",
  bus: "#12849A",
  metro: "#2A9D8F",
  origin: MAP_ORIGIN_COLOR,
  destination: MAP_DESTINATION_COLOR,
};

const HIGHLIGHT_VARIANTS = new Set<MapMarkerVariant>(["origin", "destination"]);

function resolveMarkerColor(marker: MapMarker): string {
  if (marker.intensity !== undefined) {
    return "#E9A23B";
  }

  const variant = marker.variant ?? "default";
  if (HIGHLIGHT_VARIANTS.has(variant)) {
    return MARKER_COLORS[variant];
  }

  if (marker.reliability) {
    return reliabilityPinColor(marker.reliability);
  }

  return MARKER_COLORS[variant];
}

const USER_MARKER_COLOR = "#2A9D8F";

function createUserIcon() {
  const size = 16;
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${USER_MARKER_COLOR};border:3px solid #FFFFFF;box-shadow:0 0 0 2px ${USER_MARKER_COLOR}66,0 2px 6px rgba(11,59,69,0.4);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function createMarkerIcon(marker: MapMarker) {
  const variant = marker.variant ?? "default";
  const baseSize = HIGHLIGHT_VARIANTS.has(variant) ? 18 : 14;
  const size =
    marker.intensity !== undefined
      ? Math.round(10 + marker.intensity * 18)
      : baseSize;
  const opacity = marker.intensity !== undefined ? 0.45 + marker.intensity * 0.55 : 1;
  const color = resolveMarkerColor(marker);

  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};opacity:${opacity};border:2px solid #FFFFFF;box-shadow:0 1px 4px rgba(11,59,69,0.35);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function FitBounds({
  markers,
  userPosition,
  enabled,
}: {
  markers: MapMarker[];
  userPosition?: UserPosition | null;
  enabled: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!enabled) return;

    const points: [number, number][] = markers.map((marker) => [marker.lat, marker.lng]);
    if (userPosition) {
      points.push([userPosition.lat, userPosition.lng]);
    }

    if (points.length === 0) return;

    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [24, 24] });
  }, [enabled, map, markers, userPosition]);

  return null;
}

export default function Mapa({
  markers,
  center = DEMO_CENTER,
  zoom = DEFAULT_ZOOM,
  className = "h-64 w-full rounded-xl",
  fitBounds = false,
  userPosition = null,
}: MapaProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userIcon = useMemo(() => createUserIcon(), []);

  const icons = useMemo(() => {
    const cache = new Map<string, L.DivIcon>();

    return (marker: MapMarker) => {
      const key = `${marker.variant ?? "default"}:${marker.intensity ?? "none"}:${marker.reliability?.level ?? "none"}:${marker.reliability?.sample_size ?? 0}`;
      if (!cache.has(key)) {
        cache.set(key, createMarkerIcon(marker));
      }
      return cache.get(key)!;
    };
  }, []);

  if (!mounted) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-tint text-sm text-muted`}
        aria-hidden="true"
      >
        Carregando mapa...
      </div>
    );
  }

  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full rounded-xl"
        style={{ minHeight: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {fitBounds && (
          <FitBounds markers={markers} userPosition={userPosition} enabled={fitBounds} />
        )}
        {userPosition && (
          <Marker position={[userPosition.lat, userPosition.lng]} icon={userIcon}>
            <Popup>Sua localização</Popup>
          </Marker>
        )}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={icons(marker)}
          >
            <Popup>{marker.label}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
