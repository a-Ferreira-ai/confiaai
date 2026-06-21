import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { LatLngExpression } from "leaflet";
import HeatmapLayer, { type HeatmapPoint } from "./HeatmapLayer";

const DEMO_CENTER: LatLngExpression = [-15.84, -48.08];
const DEFAULT_ZOOM = 12;

function FitBounds({ points, enabled }: { points: HeatmapPoint[]; enabled: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || points.length === 0) return;

    const latLngs = points.map((point) => [point.lat, point.lng] as [number, number]);

    if (latLngs.length === 1) {
      map.setView(latLngs[0], 14);
      return;
    }

    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds, { padding: [24, 24] });
  }, [enabled, map, points]);

  return null;
}

interface MapaDemandaMapProps {
  points: HeatmapPoint[];
  className?: string;
}

export default function MapaDemandaMap({
  points,
  className = "h-full w-full",
}: MapaDemandaMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
        center={DEMO_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ minHeight: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} enabled={points.length > 0} />
        <HeatmapLayer points={points} />
      </MapContainer>
    </div>
  );
}
