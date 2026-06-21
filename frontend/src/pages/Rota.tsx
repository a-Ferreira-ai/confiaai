import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import BotaoReportar from "../components/BotaoReportar";
import CardRota from "../components/CardRota";
import FluxoReporte, { type ReportType } from "../components/FluxoReporte";
import PromptGeofence from "../components/PromptGeofence";
import RotaTimeline, { type LegEnrichment } from "../components/RotaTimeline";
import { fetchOccupancy, fetchRoute, fetchSearch, fetchStop, fetchStops } from "../lib/api";
import {
  markPrompted,
  trackGeofenceContext,
  type GeofencePromptEvent,
} from "../lib/geofence";
import {
  NO_DATA_OCCUPANCY,
  buildRouteListUrl,
  enrichRouteOccupancy,
  firstTransitLeg,
  formatRouteTime,
  hasUnnecessaryDetour,
  sortRoutesByLeaveAt,
  transitLegs,
} from "../lib/routeHelpers";
import type {
  Occupancy,
  RouteDetailResponse,
  RouteOption,
  StopTripRef,
  TransportMode,
} from "../lib/types";

function RotaListView({
  origin,
  destination,
  modeFilter,
}: {
  origin: string;
  destination: string;
  modeFilter: TransportMode | "";
}) {
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [occupancies, setOccupancies] = useState<Map<number, Occupancy>>(new Map());
  const [originName, setOriginName] = useState<string>("");
  const [destinationName, setDestinationName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [searchResult, originStop, destinationStop] = await Promise.all([
          fetchSearch({
            originStopId: origin,
            destinationStopId: destination,
            modeFilter,
          }),
          fetchStop(origin),
          fetchStop(destination),
        ]);

        if (cancelled) return;

        setOriginName(originStop.name);
        setDestinationName(destinationStop.name);

        const sorted = sortRoutesByLeaveAt(searchResult.routes);
        setRoutes(sorted);

        const occupancyEntries = await Promise.all(
          sorted.map(async (route) => {
            const occupancy = await enrichRouteOccupancy(route).catch(() => NO_DATA_OCCUPANCY);
            return [route.route_index, occupancy] as const;
          }),
        );

        if (!cancelled) {
          setOccupancies(new Map(occupancyEntries));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao buscar rotas.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [origin, destination, modeFilter]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light text-muted">
        Carregando rotas...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-darktxt">{error}</p>
        <Link to="/" className="text-teal underline">
          Voltar à busca
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light">
      <header className="bg-ink px-6 py-6 text-paper">
        <Link to="/" className="mb-4 inline-block text-sm text-on-ink-subtle underline">
          ← Nova busca
        </Link>
        <h1 className="text-2xl font-bold">
          {originName} → {destinationName}
        </h1>
        <p className="mt-1 text-sm text-on-ink-subtle">
          {routes.length} {routes.length === 1 ? "opção" : "opções"} · ordenadas por hora de sair
        </p>
      </header>

      <main className="mx-auto max-w-lg space-y-3 px-4 py-6">
        {routes.length === 0 ? (
          <p className="text-center text-muted">Nenhuma rota encontrada.</p>
        ) : (
          routes.map((route) => (
            <CardRota
              key={route.route_index}
              route={route}
              origin={origin}
              destination={destination}
              modeFilter={modeFilter || undefined}
              occupancy={occupancies.get(route.route_index) ?? NO_DATA_OCCUPANCY}
              hasDetour={hasUnnecessaryDetour(routes, route.route_index)}
            />
          ))
        )}
      </main>
    </div>
  );
}

function RotaDetailView({
  origin,
  destination,
  routeIndex,
  modeFilter,
}: {
  origin: string;
  destination: string;
  routeIndex: number;
  modeFilter: TransportMode | "";
}) {
  const [route, setRoute] = useState<RouteDetailResponse | null>(null);
  const [legEnrichment, setLegEnrichment] = useState<Map<number, LegEnrichment>>(new Map());
  const [boardingTrips, setBoardingTrips] = useState<StopTripRef[]>([]);
  const [reportLegIndex, setReportLegIndex] = useState<number | null>(null);
  const [geofenceEvent, setGeofenceEvent] = useState<GeofencePromptEvent | null>(null);
  const [geofenceReportOpen, setGeofenceReportOpen] = useState(false);
  const [geofenceReportType, setGeofenceReportType] = useState<ReportType>("occupancy");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const listUrl = buildRouteListUrl({
    origin,
    destination,
    modeFilter: modeFilter || undefined,
  });

  const boardingLeg = route ? firstTransitLeg(route) : null;
  const boardingStopId = boardingLeg?.from_stop.id ?? null;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const routeData = await fetchRoute({
          originStopId: origin,
          destinationStopId: destination,
          modeFilter,
          routeIndex,
        });

        if (cancelled) return;
        setRoute(routeData);

        const transit = transitLegs(routeData);
        const uniqueStopIds = [...new Set(transit.map((leg) => leg.from_stop.id))];

        const stopDetails = await Promise.all(
          uniqueStopIds.map((stopId) =>
            fetchStop(stopId).catch(() => null),
          ),
        );

        const stopById = new Map(
          stopDetails.filter(Boolean).map((stop) => [stop!.id, stop!]),
        );

        const enrichmentEntries = await Promise.all(
          routeData.legs.map(async (leg, index) => {
            if (leg.leg_type !== "transit") return null;

            const [occupancyResult, stopDetail] = await Promise.all([
              fetchOccupancy(leg.from_stop.id, leg.trip_id ?? undefined)
                .then((response) => response.occupancy)
                .catch(() => NO_DATA_OCCUPANCY),
              Promise.resolve(stopById.get(leg.from_stop.id)),
            ]);

            const enrichment: LegEnrichment = {
              occupancy: occupancyResult,
              safety: stopDetail?.safety,
            };

            return [index, enrichment] as const;
          }),
        );

        if (cancelled) return;

        setLegEnrichment(new Map(enrichmentEntries.filter(Boolean) as [number, LegEnrichment][]));

        const firstLeg = firstTransitLeg(routeData);
        if (firstLeg) {
          const boardingStop = stopById.get(firstLeg.from_stop.id);
          setBoardingTrips(boardingStop?.trips ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao carregar rota.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [origin, destination, modeFilter, routeIndex]);

  const reloadEnrichment = useCallback(() => {
    if (!route || boardingStopId === null) return;

    fetchStop(boardingStopId)
      .then((stop) => setBoardingTrips(stop.trips))
      .catch(() => {});

    transitLegs(route).forEach((leg) => {
      const legIndex = route.legs.indexOf(leg);
      fetchOccupancy(leg.from_stop.id, leg.trip_id ?? undefined)
        .then((response) => {
          setLegEnrichment((current) => {
            const next = new Map(current);
            const existing = next.get(legIndex) ?? { occupancy: NO_DATA_OCCUPANCY };
            next.set(legIndex, { ...existing, occupancy: response.occupancy });
            return next;
          });
        })
        .catch(() => {});
    });
  }, [route, boardingStopId]);

  useEffect(() => {
    if (boardingStopId === null) return;

    let cleanupWatch: (() => void) | undefined;

    fetchStops()
      .then((data) => {
        cleanupWatch = trackGeofenceContext({
          stops: data.stops,
          filterStopId: boardingStopId,
          defaultKind: "boarding",
          onPrompt: (event) => {
            setGeofenceEvent((current) => {
              if (current?.stop.id === event.stop.id && current.kind === event.kind) {
                return current;
              }
              return event;
            });
          },
        });
      })
      .catch(() => {});

    return () => {
      cleanupWatch?.();
    };
  }, [boardingStopId]);

  function dismissGeofencePrompt() {
    if (geofenceEvent) markPrompted(geofenceEvent.stop.id);
    setGeofenceEvent(null);
    setGeofenceReportOpen(false);
  }

  function openGeofenceReport(initialType: ReportType) {
    setGeofenceReportType(initialType);
    setGeofenceReportOpen(true);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light text-muted">
        Carregando rota...
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-darktxt">{error ?? "Rota não encontrada."}</p>
        <Link to={listUrl} className="text-teal underline">
          Ver outras rotas
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light pb-24">
      <header className="bg-ink px-6 py-6 text-paper">
        <Link to={listUrl} className="mb-4 inline-block text-sm text-on-ink-subtle underline">
          ← Ver outras rotas
        </Link>
        <p className="text-sm text-on-ink-subtle">
          Chegada prevista às {formatRouteTime(route.arrive_at)} · {route.total_minutes} min
        </p>
      </header>

      <section className="bg-sea px-6 py-8 text-on-sea">
        <p className="text-sm font-medium uppercase tracking-wide opacity-90">Hora de sair</p>
        <h1 className="mt-1 text-3xl font-bold">Saia às {formatRouteTime(route.leave_at)}</h1>
        <p className="mt-2 text-sm opacity-90">para chegar pontual</p>
      </section>

      <main className="mx-auto max-w-lg px-4 py-6">
        <RotaTimeline
          route={route}
          legEnrichment={legEnrichment}
          boardingStopId={boardingStopId}
          boardingTrips={boardingTrips}
          reportLegIndex={reportLegIndex}
          onOpenReport={setReportLegIndex}
          onCloseReport={() => setReportLegIndex(null)}
          onReportSuccess={reloadEnrichment}
        />
      </main>

      {boardingStopId !== null && boardingLeg && (
        <BotaoReportar
          stopId={boardingStopId}
          stopName={boardingLeg.from_stop.name}
          trips={boardingTrips}
          onSuccess={reloadEnrichment}
        />
      )}

      {geofenceEvent && !geofenceReportOpen && boardingLeg && (
        <PromptGeofence
          kind={geofenceEvent.kind}
          stop={geofenceEvent.stop}
          lineName={boardingLeg.line_name ?? undefined}
          onReport={openGeofenceReport}
          onDismiss={dismissGeofencePrompt}
        />
      )}

      {geofenceReportOpen && geofenceEvent && boardingStopId !== null && boardingLeg && (
        <FluxoReporte
          stopId={boardingStopId}
          stopName={boardingLeg.from_stop.name}
          trips={boardingTrips}
          context="geofence_boarding"
          initialType={geofenceReportType}
          onSuccess={() => {
            markPrompted(geofenceEvent.stop.id);
            reloadEnrichment();
          }}
          onClose={dismissGeofencePrompt}
        />
      )}
    </div>
  );
}

export default function Rota() {
  const [searchParams] = useSearchParams();
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const modeFilter = (searchParams.get("mode_filter") ?? "") as TransportMode | "";
  const hasRouteIndex = searchParams.has("route_index");
  const routeIndex = Number(searchParams.get("route_index") ?? "0");

  if (!origin || !destination) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-darktxt">Parâmetros de rota inválidos.</p>
        <Link to="/" className="text-teal underline">
          Voltar à busca
        </Link>
      </div>
    );
  }

  if (hasRouteIndex) {
    return (
      <RotaDetailView
        origin={origin}
        destination={destination}
        routeIndex={routeIndex}
        modeFilter={modeFilter}
      />
    );
  }

  return (
    <RotaListView origin={origin} destination={destination} modeFilter={modeFilter} />
  );
}
