import { getDeviceToken } from "./deviceToken";
import type {
  ApiError,
  ArrivalReportResponse,
  DemandResponse,
  LineDetail,
  LinesResponse,
  OccupancyLevel,
  OccupancyReportResponse,
  OccupancyResponse,
  RankingResponse,
  ReportContext,
  RouteDetailResponse,
  RouteParams,
  SearchParams,
  SearchResponse,
  StopDetail,
  StopReportCategory,
  StopReportResponse,
  StopsResponse,
} from "./types";

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("X-Device-Token", getDeviceToken());
  headers.set("Accept", "application/json");

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, { ...init, headers });

  if (!response.ok) {
    let message = `Erro ${response.status}`;
    try {
      const body = (await response.json()) as ApiError;
      message = body.message ?? message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function fetchLines(): Promise<LinesResponse> {
  return apiFetch<LinesResponse>("/api/v1/linhas");
}

export function fetchLine(id: number | string): Promise<LineDetail> {
  return apiFetch<LineDetail>(`/api/v1/linhas/${id}`);
}

export function fetchStops(mode?: string): Promise<StopsResponse> {
  const query = mode ? `?mode=${encodeURIComponent(mode)}` : "";
  return apiFetch<StopsResponse>(`/api/v1/paradas${query}`);
}

export function fetchStop(id: number | string): Promise<StopDetail> {
  return apiFetch<StopDetail>(`/api/v1/paradas/${id}`);
}

export function fetchOccupancy(
  stopId: number | string,
  tripId?: number | string,
): Promise<OccupancyResponse> {
  const params = new URLSearchParams({ stop_id: String(stopId) });
  if (tripId !== undefined) {
    params.set("trip_id", String(tripId));
  }
  return apiFetch<OccupancyResponse>(`/api/v1/ocupacao?${params.toString()}`);
}

function buildSearchQuery(params: SearchParams): URLSearchParams {
  const query = new URLSearchParams({
    origin_stop_id: String(params.originStopId),
    destination_stop_id: String(params.destinationStopId),
  });
  if (params.modeFilter) {
    query.set("mode_filter", params.modeFilter);
  }
  if (params.arriveBy) {
    query.set("arrive_by", params.arriveBy);
  }
  return query;
}

export function fetchSearch(params: SearchParams): Promise<SearchResponse> {
  return apiFetch<SearchResponse>(`/api/v1/busca?${buildSearchQuery(params).toString()}`);
}

export function fetchRoute(params: RouteParams): Promise<RouteDetailResponse> {
  const query = buildSearchQuery(params);
  query.set("route_index", String(params.routeIndex ?? 0));
  return apiFetch<RouteDetailResponse>(`/api/v1/rotas?${query.toString()}`);
}

export function fetchDemand(days?: number): Promise<DemandResponse> {
  const query = days !== undefined ? `?days=${encodeURIComponent(String(days))}` : "";
  return apiFetch<DemandResponse>(`/api/v1/demanda${query}`);
}

export function fetchRanking(): Promise<RankingResponse> {
  return apiFetch<RankingResponse>("/api/v1/ranking");
}

export function postReportParada(body: {
  stop_id: number;
  category: StopReportCategory;
  severity: number;
  context: ReportContext;
}): Promise<StopReportResponse> {
  return apiFetch<StopReportResponse>("/api/v1/reportes/parada", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function postReportChegada(body: {
  trip_id: number;
  stop_id: number;
  scheduled_at: string;
  observed_at: string;
  context: ReportContext;
}): Promise<ArrivalReportResponse> {
  return apiFetch<ArrivalReportResponse>("/api/v1/reportes/chegada", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function postReportOcupacao(body: {
  trip_id: number;
  stop_id: number;
  level: OccupancyLevel;
  context: ReportContext;
}): Promise<OccupancyReportResponse> {
  return apiFetch<OccupancyReportResponse>("/api/v1/reportes/ocupacao", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
