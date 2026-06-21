import { Link } from "react-router-dom";
import FaixaConfianca from "./FaixaConfianca";
import IndicadorOcupacao from "./IndicadorOcupacao";
import TagEstimativa from "./TagEstimativa";
import {
  buildRouteDetailUrl,
  formatRouteTime,
  modeIconsForLegs,
  routeHasMetro,
  worstReliabilityFromLegs,
} from "../lib/routeHelpers";
import type { Occupancy, RouteOption } from "../lib/types";

interface CardRotaProps {
  route: RouteOption;
  origin: string;
  destination: string;
  modeFilter?: string;
  occupancy: Occupancy;
  hasDetour: boolean;
}

export default function CardRota({
  route,
  origin,
  destination,
  modeFilter,
  occupancy,
  hasDetour,
}: CardRotaProps) {
  const reliability = worstReliabilityFromLegs(route.legs);
  const detailUrl = buildRouteDetailUrl({
    origin,
    destination,
    routeIndex: route.route_index,
    modeFilter,
  });

  return (
    <Link
      to={detailUrl}
      className="block rounded-xl border border-tint bg-paper p-4 shadow-sm transition hover:border-teal/30 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>
            {modeIconsForLegs(route.legs)}
          </span>
          <span className="text-xl font-bold text-darktxt">{route.total_minutes} min</span>
          {hasDetour && (
            <span className="rounded-full bg-coral/15 px-2 py-0.5 text-xs font-semibold text-coral">
              Rota com desvio
            </span>
          )}
          {routeHasMetro(route.legs) && <TagEstimativa />}
        </div>
      </div>

      <p className="text-sm text-darktxt">
        Sai {formatRouteTime(route.leave_at)} · Chega {formatRouteTime(route.arrive_at)}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <FaixaConfianca reliability={reliability} compact />
        <IndicadorOcupacao occupancy={occupancy} compact />
      </div>
    </Link>
  );
}
