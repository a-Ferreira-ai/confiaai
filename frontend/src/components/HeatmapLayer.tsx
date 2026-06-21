import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

const AMBER_GRADIENT: Record<number, string> = {
  0.0: "transparent",
  0.3: "#F5D998",
  0.6: "#E9A23B",
  1.0: "#C47E1A",
};

interface HeatmapLayerProps {
  points: HeatmapPoint[];
}

export default function HeatmapLayer({ points }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;

    const data: [number, number, number][] = points.map((point) => [
      point.lat,
      point.lng,
      Math.max(point.intensity, 0.05),
    ]);

    const layer = L.heatLayer(data, {
      radius: 35,
      blur: 20,
      maxZoom: 17,
      minOpacity: 0.35,
      gradient: AMBER_GRADIENT,
    });

    layer.addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
}
