import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import ListaFavoritosCompacta from "../components/ListaFavoritosCompacta";
import ListaRecentes from "../components/ListaRecentes";
import Mapa, { type MapMarker, type UserPosition } from "../components/Mapa";
import { fetchSearch, fetchStops } from "../lib/api";
import { addRecente } from "../lib/recentes";
import type { StopSummary, TransportMode } from "../lib/types";

const MODE_CHIPS: { value: TransportMode | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "bus", label: "Ônibus" },
  { value: "metro", label: "Metrô" },
];

export default function Busca() {
  const navigate = useNavigate();
  const originRef = useRef<HTMLSelectElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);

  const [stops, setStops] = useState<StopSummary[]>([]);
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [modeFilter, setModeFilter] = useState<TransportMode | "">("");
  const [expanded, setExpanded] = useState(false);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listRefreshKey, setListRefreshKey] = useState("init");

  useEffect(() => {
    fetchStops()
      .then((data) => setStops(data.stops))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 15_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (!expanded) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (searchPanelRef.current && !searchPanelRef.current.contains(target)) {
        setExpanded(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [expanded]);

  useEffect(() => {
    if (expanded) {
      originRef.current?.focus();
    }
  }, [expanded]);

  const filteredStops = useMemo(
    () => (modeFilter ? stops.filter((stop) => stop.mode === modeFilter) : stops),
    [stops, modeFilter],
  );

  useEffect(() => {
    const validIds = new Set(filteredStops.map((stop) => String(stop.id)));
    if (originId && !validIds.has(originId)) setOriginId("");
    if (destinationId && !validIds.has(destinationId)) setDestinationId("");
  }, [filteredStops, originId, destinationId]);

  const stopById = useMemo(() => new Map(stops.map((stop) => [String(stop.id), stop])), [stops]);

  const mapMarkers = useMemo<MapMarker[]>(
    () =>
      filteredStops.map((stop) => {
        const stopId = String(stop.id);
        let variant: MapMarker["variant"] | undefined;

        if (originId && stopId === originId) {
          variant = "origin";
        } else if (destinationId && stopId === destinationId) {
          variant = "destination";
        }

        return {
          id: stop.id,
          lat: parseFloat(stop.latitude),
          lng: parseFloat(stop.longitude),
          label: stop.name,
          variant,
          reliability: variant ? undefined : stop.reliability,
        };
      }),
    [filteredStops, originId, destinationId],
  );

  const collapsedLabel = useMemo(() => {
    if (originId && destinationId) {
      const origin = stopById.get(originId);
      const destination = stopById.get(destinationId);
      if (origin && destination) {
        return `${origin.name} → ${destination.name}`;
      }
    }
    return "Para onde você vai?";
  }, [originId, destinationId, stopById]);

  async function runSearch(origin: string, destination: string) {
    setError(null);

    if (!origin || !destination) {
      setError("Selecione origem e destino.");
      return;
    }

    if (origin === destination) {
      setError("Origem e destino devem ser diferentes.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await fetchSearch({
        originStopId: origin,
        destinationStopId: destination,
        modeFilter,
      });

      if (result.routes.length === 0) {
        setError("Nenhuma rota encontrada para essa combinação.");
        return;
      }

      const originStop = stopById.get(origin);
      const destinationStop = stopById.get(destination);

      if (originStop && destinationStop) {
        addRecente({
          originId: originStop.id,
          originName: originStop.name,
          destinationId: destinationStop.id,
          destinationName: destinationStop.name,
          modeFilter,
        });
        setListRefreshKey(`${origin}-${destination}-${Date.now()}`);
      }

      const query = new URLSearchParams({
        origin,
        destination,
      });
      if (modeFilter) {
        query.set("mode_filter", modeFilter);
      }

      navigate(`/rota?${query.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar rota.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void runSearch(originId, destinationId);
  }

  function handleRecentSelect(origin: string, destination: string) {
    setOriginId(origin);
    setDestinationId(destination);
    setExpanded(true);
    void runSearch(origin, destination);
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-muted">
        Carregando paradas...
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-ink px-4 pb-4 pt-6 text-paper">
        <h1 className="text-xl font-bold">Confia AI</h1>
        <div ref={searchPanelRef} className="mt-4">
          {!expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="flex w-full items-center gap-3 rounded-xl bg-ink2 px-4 py-3.5 text-left text-on-ink-subtle transition hover:bg-ink-light"
            >
              <span className="text-lg" aria-hidden>
                🔍
              </span>
              <span className={originId && destinationId ? "text-paper" : "text-on-ink-tertiary"}>
                {collapsedLabel}
              </span>
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 rounded-xl bg-ink2 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-paper">Planejar viagem</p>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="text-sm text-on-ink-subtle underline"
                >
                  Cancelar
                </button>
              </div>

              <div className="space-y-2">
                <label htmlFor="origin" className="block text-xs font-medium text-on-ink-tertiary">
                  De
                </label>
                <select
                  ref={originRef}
                  id="origin"
                  value={originId}
                  onChange={(event) => setOriginId(event.target.value)}
                  className="w-full rounded-lg border border-tint/30 bg-paper px-3 py-2.5 text-darktxt focus:border-sea focus:outline-none focus:ring-2 focus:ring-sea/30"
                >
                  <option value="">Selecione a origem</option>
                  {filteredStops.map((stop) => (
                    <option key={stop.id} value={stop.id}>
                      {stop.name} ({stop.mode_label})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="destination"
                  className="block text-xs font-medium text-on-ink-tertiary"
                >
                  Para
                </label>
                <select
                  id="destination"
                  value={destinationId}
                  onChange={(event) => setDestinationId(event.target.value)}
                  className="w-full rounded-lg border border-tint/30 bg-paper px-3 py-2.5 text-darktxt focus:border-sea focus:outline-none focus:ring-2 focus:ring-sea/30"
                >
                  <option value="">Selecione o destino</option>
                  {filteredStops.map((stop) => (
                    <option key={stop.id} value={stop.id}>
                      {stop.name} ({stop.mode_label})
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="rounded-lg border border-tint bg-light px-3 py-2 text-sm text-darktxt" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-sea px-6 py-3 text-sm font-semibold text-paper transition hover:bg-sea/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Buscando..." : "Buscar rota"}
              </button>
            </form>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          {MODE_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => setModeFilter(chip.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                modeFilter === chip.value
                  ? "bg-paper text-ink"
                  : "bg-ink2 text-on-ink-subtle hover:bg-ink-light"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </header>

      <main className="space-y-6 px-4 py-6">
        <section className="overflow-hidden rounded-xl border border-tint bg-paper shadow-sm">
          <Mapa
            markers={mapMarkers}
            userPosition={userPosition}
            fitBounds
            className="h-60 w-full"
          />
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-darktxt">Favoritos</h2>
          </div>
          <ListaFavoritosCompacta limit={5} refreshKey={listRefreshKey} />
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-darktxt">Recentes</h2>
          <ListaRecentes
            limit={5}
            refreshKey={listRefreshKey}
            onSelect={handleRecentSelect}
          />
        </section>
      </main>
    </div>
  );
}
