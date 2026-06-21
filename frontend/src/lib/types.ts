export type ReliabilityLevel = "high" | "medium" | "low";

export type SafetyLevel = "high" | "medium" | "low";

export type ReportKind = "stop_report" | "arrival_event" | "occupancy_reading";

export type ReportContext =
  | "geofence_arrival"
  | "geofence_boarding"
  | "on_demand";

export type StopReportCategory = "iluminacao" | "infraestrutura" | "seguranca_geral";

export interface ReportBroadcast {
  event: "report_created";
  kind: ReportKind;
  stop_id: number;
  trip_id?: number;
}

export interface Safety {
  level: SafetyLevel | "no_data";
  label: string;
  sample_size: number;
  average_severity: number | null;
}

export type TransportMode = "bus" | "metro";

export type OccupancyLevel = "free" | "moderate" | "crowded" | "packed";

export interface Reliability {
  level: ReliabilityLevel;
  label: string;
  sample_size: number;
  median_delay_seconds: number | null;
  on_time_percent: number | null;
}

export interface Occupancy {
  level: OccupancyLevel | "moderate";
  label: string;
  sample_size: number;
  source: "seat_sensor" | "turnstile" | "user_report" | null;
  source_label: string | null;
  recorded_at: string | null;
}

export interface LineSummary {
  id: number;
  gtfs_id: string;
  name: string;
  mode: TransportMode;
  mode_label: string;
  color: string | null;
  reliability: Reliability;
}

export interface StopSummary {
  id: number;
  gtfs_id: string;
  name: string;
  mode: TransportMode;
  mode_label: string;
  latitude: string;
  longitude: string;
  reliability: Reliability;
}

export interface LineDetail extends Omit<LineSummary, "reliability"> {
  reliability: Reliability;
  stops: StopSummary[];
}

export interface StopLineSummary {
  id: number;
  gtfs_id: string;
  name: string;
  mode: TransportMode;
  mode_label: string;
  color: string | null;
  reliability: Reliability;
}

export interface StopTripRef {
  id: number;
  headsign: string;
  line_id: number;
  line_name: string;
  scheduled_at: string | null;
}

export interface StopDetail {
  id: number;
  gtfs_id: string;
  name: string;
  mode: TransportMode;
  mode_label: string;
  latitude: string;
  longitude: string;
  reliability: Reliability;
  safety: Safety;
  lines: StopLineSummary[];
  trips: StopTripRef[];
}

export interface StopReportResponse {
  id: number;
  stop_id: number;
  category: StopReportCategory;
  category_label: string;
  severity: number;
  context: ReportContext;
  context_label: string;
  recorded_at: string;
  safety: Safety;
}

export interface ArrivalReportResponse {
  id: number;
  trip_id: number;
  stop_id: number;
  scheduled_at: string;
  observed_at: string;
  delay_seconds: number;
  source: string;
  source_label: string;
  context: ReportContext;
  context_label: string;
}

export interface OccupancyReportResponse {
  id: number;
  trip_id: number;
  stop_id: number;
  recorded_at: string;
  source: string;
  source_label: string;
  context: ReportContext;
  context_label: string;
  level: OccupancyLevel | null;
  level_label: string | null;
  free_seats: number | null;
  boarding_count: number | null;
}

export interface OccupancyResponse {
  stop_id: number;
  trip_id: number | null;
  occupancy: Occupancy;
}

export interface LinesResponse {
  lines: LineSummary[];
}

export interface StopsResponse {
  stops: StopSummary[];
}

export interface ApiError {
  message: string;
  errors?: string[];
}

export interface RouteStopRef {
  id: number;
  name: string;
  mode: TransportMode | "transfer";
}

export interface RouteLeg {
  leg_type: "transit" | "transfer";
  mode: TransportMode | "transfer";
  mode_label: string;
  line_id: number | null;
  line_name: string;
  trip_id: number | null;
  from_stop: RouteStopRef;
  to_stop: RouteStopRef;
  duration_minutes: number;
  buffer_seconds: number;
  depart_at: string | null;
  arrive_at: string | null;
  reliability?: Reliability;
}

export interface RouteOption {
  route_index: number;
  route_type: "direct" | "transfer";
  leave_at: string;
  arrive_at: string;
  total_minutes: number;
  buffer_seconds: number;
  reliability: Reliability;
  legs: RouteLeg[];
}

export interface SearchResponse {
  origin_stop_id: number;
  destination_stop_id: number;
  routes: RouteOption[];
}

export interface RouteDetailResponse extends RouteOption {
  origin_stop_id: number;
  destination_stop_id: number;
}

export interface SearchParams {
  originStopId: number | string;
  destinationStopId: number | string;
  modeFilter?: TransportMode | "";
  arriveBy?: string;
}

export interface RouteParams extends SearchParams {
  routeIndex?: number;
}

export interface DemandPoint {
  stop_id: number;
  name: string;
  latitude: string;
  longitude: string;
  search_count: number;
  intensity: number;
}

export interface DemandResponse {
  window_days: number;
  total_searches: number;
  points: DemandPoint[];
}

export interface RankingLine extends LineSummary {
  rank: number;
}

export interface RankingResponse {
  lines: RankingLine[];
}
