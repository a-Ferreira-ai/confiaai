import type { Layer, LatLngExpression } from "leaflet";

declare module "leaflet" {
  interface HeatMapOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }

  interface HeatLayer extends Layer {
    setOptions(options: HeatMapOptions): HeatLayer;
    addLatLng(latlng: LatLngExpression, intensity?: number): HeatLayer;
    setLatLngs(latlngs: Array<[number, number, number?]>): HeatLayer;
  }

  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: HeatMapOptions,
  ): HeatLayer;
}

declare module "leaflet.heat";
