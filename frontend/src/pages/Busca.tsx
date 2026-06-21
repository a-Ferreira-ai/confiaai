import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Mapa, { type MapMarker } from "../components/Mapa";
import { fetchSearch, fetchStops } from "../lib/api";
import type { StopSummary, TransportMode } from "../lib/types";

export default function Busca() {
  const navigate = useNavigate();
  const [stops, setStops] = useState<StopSummary[]>([]);
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [modeFilter, setModeFilter] = useState<TransportMode | "">("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStops()
      .then((data) => setStops(data.stops))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const mapMarkers = useMemo<MapMarker[]>(
    () =>
      stops.map((stop) => {
        const stopId = String(stop.id);
        let variant: MapMarker["variant"] = stop.mode;

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
        };
      }),
    [stops, originId, destinationId],
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!originId || !destinationId) {
      setError("Selecione origem e destino.");
      return;
    }

    if (originId === destinationId) {
      setError("Origem e destino devem ser diferentes.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await fetchSearch({
        originStopId: originId,
        destinationStopId: destinationId,
        modeFilter,
      });

      if (result.routes.length === 0) {
        setError("Nenhuma rota encontrada para essa combinação.");
        return;
      }

      const query = new URLSearchParams({
        origin: originId,
        destination: destinationId,
        route_index: "0",
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light text-muted">
        Carregando paradas...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light">
      <header className="bg-ink px-6 py-8 text-paper">
        <Link to="/" className="mb-4 inline-block text-sm text-[#9FC6CC] underline">
          ← Início
        </Link>
        <p className="text-sm uppercase tracking-widest text-[#7FA9AF]">Hora de sair</p>
        <h1 className="text-3xl font-bold">Planejar viagem</h1>
        <p className="mt-2 text-[#9FC6CC]">
          Escolha origem e destino no corredor Ceilândia ↔ Taguatinga.
        </p>
      </header>

      <main className="mx-auto max-w-lg space-y-6 px-4 py-6">
        <section className="overflow-hidden rounded-xl border border-tint bg-paper shadow-sm">
          <Mapa markers={mapMarkers} fitBounds className="h-64 w-full" />
        </section>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-tint bg-paper p-5 shadow-sm">
          <div className="space-y-2">
            <label htmlFor="origin" className="block text-sm font-medium text-darktxt">
              Origem
            </label>
            <select
              id="origin"
              value={originId}
              onChange={(event) => setOriginId(event.target.value)}
              className="w-full rounded-lg border border-tint bg-light px-3 py-2.5 text-darktxt focus:border-sea focus:outline-none focus:ring-2 focus:ring-sea/30"
            >
              <option value="">Selecione a parada de origem</option>
              {stops.map((stop) => (
                <option key={stop.id} value={stop.id}>
                  {stop.name} ({stop.mode_label})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="destination" className="block text-sm font-medium text-darktxt">
              Destino
            </label>
            <select
              id="destination"
              value={destinationId}
              onChange={(event) => setDestinationId(event.target.value)}
              className="w-full rounded-lg border border-tint bg-light px-3 py-2.5 text-darktxt focus:border-sea focus:outline-none focus:ring-2 focus:ring-sea/30"
            >
              <option value="">Selecione a parada de destino</option>
              {stops.map((stop) => (
                <option key={stop.id} value={stop.id}>
                  {stop.name} ({stop.mode_label})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="mode" className="block text-sm font-medium text-darktxt">
              Modo (opcional)
            </label>
            <select
              id="mode"
              value={modeFilter}
              onChange={(event) => setModeFilter(event.target.value as TransportMode | "")}
              className="w-full rounded-lg border border-tint bg-light px-3 py-2.5 text-darktxt focus:border-sea focus:outline-none focus:ring-2 focus:ring-sea/30"
            >
              <option value="">Todos</option>
              <option value="bus">Ônibus</option>
              <option value="metro">Metrô</option>
            </select>
          </div>

          {error && (
            <p className="rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral" role="alert">
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
      </main>
    </div>
  );
}
