import { Link } from "react-router-dom";
import FaixaConfianca from "./FaixaConfianca";
import FluxoReporte from "./FluxoReporte";
import IndicadorOcupacao from "./IndicadorOcupacao";
import IndicadorSeguranca from "./IndicadorSeguranca";
import TagEstimativa from "./TagEstimativa";
import { formatRouteTime, NO_DATA_OCCUPANCY, NO_DATA_RELIABILITY } from "../lib/routeHelpers";
import type { Occupancy, RouteDetailResponse, RouteLeg, Safety, StopTripRef } from "../lib/types";

export interface LegEnrichment {
  occupancy: Occupancy;
  safety?: Safety;
}

interface RotaTimelineProps {
  route: RouteDetailResponse;
  legEnrichment: Map<number, LegEnrichment>;
  boardingStopId: number | null;
  boardingTrips: StopTripRef[];
  reportLegIndex: number | null;
  onOpenReport: (legIndex: number) => void;
  onCloseReport: () => void;
  onReportSuccess: () => void;
}

function TimelineNode({ children, isLast = false }: { children: React.ReactNode; isLast?: boolean }) {
  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      <div className="relative flex flex-col items-center self-stretch">
        <div className="z-10 h-3 w-3 shrink-0 rounded-full bg-teal ring-4 ring-paper" />
        {!isLast && (
          <div className="absolute bottom-0 left-1/2 top-3 w-0.5 -translate-x-1/2 bg-tint" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1 -mt-0.5">{children}</div>
    </div>
  );
}

function legWaitLabel(leg: RouteLeg): string {
  if (leg.leg_type === "transfer") {
    return `Caminhe ${leg.duration_minutes} min até ${leg.to_stop.name}`;
  }
  if (leg.mode === "bus") {
    return `Espere a linha ${leg.line_name}`;
  }
  return `Espere ${leg.line_name}`;
}

export default function RotaTimeline({
  route,
  legEnrichment,
  boardingStopId,
  boardingTrips,
  reportLegIndex,
  onOpenReport,
  onCloseReport,
  onReportSuccess,
}: RotaTimelineProps) {
  const reportLeg = reportLegIndex !== null ? route.legs[reportLegIndex] : null;

  return (
    <>
      <TimelineNode>
        <p className="text-sm font-semibold text-darktxt">
          {formatRouteTime(route.leave_at)} Saia de casa
        </p>
        <p className="text-sm text-muted">para chegar pontual</p>
      </TimelineNode>

      {route.legs.map((leg, index) => {
        const enrichment = legEnrichment.get(index);
        const isTransit = leg.leg_type === "transit";
        const isFirst = index === 0;

        return (
          <TimelineNode key={`${leg.line_id ?? "transfer"}-${leg.from_stop.id}-${index}`}>
            {isFirst && leg.leg_type === "transfer" && (
              <p className="mb-2 text-sm text-muted">
                🚶 {leg.duration_minutes} min até o ponto
              </p>
            )}

            {isTransit && (
              <>
                <p className="text-sm font-semibold text-darktxt">
                  {formatRouteTime(leg.depart_at)}{" "}
                  <Link to={`/parada/${leg.from_stop.id}`} className="text-teal underline">
                    {leg.from_stop.name}
                  </Link>
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                  <span>{legWaitLabel(leg)}</span>
                  {leg.mode === "metro" && <TagEstimativa />}
                </p>

                <div className="mt-3">
                  <FaixaConfianca
                    reliability={leg.reliability ?? NO_DATA_RELIABILITY}
                    compact
                  />
                </div>

                {enrichment?.safety && (
                  <div className="mt-2">
                    <IndicadorSeguranca safety={enrichment.safety} variant="selo" />
                  </div>
                )}

                <p className="mt-3 text-sm font-semibold text-darktxt">
                  {formatRouteTime(leg.arrive_at)} Embarque
                </p>

                <div className="mt-2">
                  <IndicadorOcupacao
                    occupancy={enrichment?.occupancy ?? NO_DATA_OCCUPANCY}
                    compact
                  />
                </div>

                {boardingStopId === leg.from_stop.id && boardingTrips.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenReport(index)}
                    className="mt-3 rounded-full border border-teal/30 bg-teal/10 px-4 py-2 text-sm font-medium text-teal transition hover:bg-teal/20"
                  >
                    Reportar chegada
                  </button>
                )}

                {leg.line_id && (
                  <Link
                    to={`/linha/${leg.line_id}`}
                    className="mt-2 inline-block text-xs text-teal underline"
                  >
                    Ver linha
                  </Link>
                )}

                <p className="mt-3 text-sm text-darktxt">
                  {formatRouteTime(leg.arrive_at)} Desça em{" "}
                  <Link to={`/parada/${leg.to_stop.id}`} className="text-teal underline">
                    {leg.to_stop.name}
                  </Link>
                </p>
              </>
            )}

            {leg.leg_type === "transfer" && !isFirst && (
              <p className="text-sm text-muted">
                🚶 {leg.duration_minutes} min · {leg.from_stop.name} → {leg.to_stop.name}
              </p>
            )}
          </TimelineNode>
        );
      })}

      <TimelineNode isLast>
        <p className="text-sm font-semibold text-darktxt">
          {formatRouteTime(route.arrive_at)} Chegada prevista
        </p>
        <p className="text-sm text-muted">{route.total_minutes} min no total</p>
      </TimelineNode>

      {reportLeg && boardingStopId !== null && (
        <FluxoReporte
          stopId={boardingStopId}
          stopName={reportLeg.from_stop.name}
          trips={boardingTrips}
          context="on_demand"
          initialType="arrival"
          onSuccess={onReportSuccess}
          onClose={onCloseReport}
        />
      )}
    </>
  );
}
