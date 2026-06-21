import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { LatLngExpression } from "leaflet";

export type MapMarkerVariant = "default" | "origin" | "destination" | "bus" | "metro";

export interface MapMarker {
  id: string | number;
  lat: number;
  lng: number;
  label: string;
  variant?: MapMarkerVariant;
  intensity?: number;
}

export interface MapaProps {
  markers: MapMarker[];
  center?: LatLngExpression;
  zoom?: number;
  className?: string;
  fitBounds?: boolean;
}

const DEMO_CENTER: LatLngExpression = [-15.84, -48.08];
const DEFAULT_ZOOM = 12;

const MARKER_COLORS: Record<MapMarkerVariant, string> = {
  default: "#5B7079",
  bus: "#12849A",
  metro: "#2A9D8F",
  origin: "#E9A23B",
  destination: "#E2674E",
};

const HIGHLIGHT_VARIANTS = new Set<MapMarkerVariant>(["origin", "destination"]);

function markerColor(variant: MapMarkerVariant = "default"): string {
  return MARKER_COLORS[variant];
}

function createMarkerIcon(variant: MapMarkerVariant = "default", intensity?: number) {
  const baseSize = HIGHLIGHT_VARIANTS.has(variant) ? 18 : 14;
  const size =
    intensity !== undefined
      ? Math.round(10 + intensity * 18)
      : baseSize;
  const opacity = intensity !== undefined ? 0.45 + intensity * 0.55 : 1;
  const color =
    intensity !== undefined ? "#E9A23B" : markerColor(variant);

  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};opacity:${opacity};border:2px solid #FFFFFF;box-shadow:0 1px 4px rgba(11,59,69,0.35);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function FitBounds({ markers, enabled }: { markers: MapMarker[]; enabled: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || markers.length === 0) return;

    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 14);
      return;
    }

    const bounds = L.latLngBounds(markers.map((marker) => [marker.lat, marker.lng]));
    map.fitBounds(bounds, { padding: [24, 24] });
  }, [enabled, map, markers]);

  return null;
}

export default function Mapa({
  markers,
  center = DEMO_CENTER,
  zoom = DEFAULT_ZOOM,
  className = "h-64 w-full rounded-xl",
  fitBounds = false,
}: MapaProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const icons = useMemo(() => {
    const cache = new Map<string, L.DivIcon>();

    return (variant: MapMarkerVariant = "default", intensity?: number) => {
      const key = `${variant}:${intensity ?? "none"}`;
      if (!cache.has(key)) {
        cache.set(key, createMarkerIcon(variant, intensity));
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
        {fitBounds && <FitBounds markers={markers} enabled={fitBounds} />}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={icons(marker.variant ?? "default", marker.intensity)}
          >
            <Popup>{marker.label}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
