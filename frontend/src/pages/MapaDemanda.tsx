import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Mapa, { type MapMarker } from "../components/Mapa";
import { fetchDemand } from "../lib/api";
import type { DemandPoint } from "../lib/types";

export default function MapaDemanda() {
  const [points, setPoints] = useState<DemandPoint[]>([]);
  const [windowDays, setWindowDays] = useState(7);
  const [totalSearches, setTotalSearches] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchDemand()
      .then((data) => {
        if (cancelled) return;
        setPoints(data.points);
        setWindowDays(data.window_days);
        setTotalSearches(data.total_searches);
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const markers = useMemo<MapMarker[]>(
    () =>
      points.map((point) => ({
        id: point.stop_id,
        lat: parseFloat(point.latitude),
        lng: parseFloat(point.longitude),
        label: `${point.name} (${point.search_count} buscas)`,
        intensity: point.intensity,
      })),
    [points],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light text-muted">
        Carregando mapa de demanda...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light">
      <header className="border-b border-tint bg-paper px-4 py-4">
        <Link to="/" className="text-sm text-teal hover:underline">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-xl font-bold text-darktxt">Mapa de demanda</h1>
        <p className="mt-1 text-sm text-muted">
          Buscas origem→destino nos últimos {windowDays} dias ({totalSearches}{" "}
          {totalSearches === 1 ? "busca" : "buscas"}).
        </p>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        {error && (
          <p className="mb-4 rounded-lg bg-coral/10 px-4 py-3 text-sm text-coral">{error}</p>
        )}

        {points.length === 0 ? (
          <div className="rounded-xl bg-paper p-6 text-center shadow-sm">
            <p className="text-darktxt">Ainda não há buscas registradas.</p>
            <p className="mt-2 text-sm text-muted">
              Planeje uma viagem em Busca para alimentar o mapa de calor.
            </p>
            <Link
              to="/busca"
              className="mt-4 inline-block rounded-full bg-sea px-5 py-2 text-sm font-semibold text-paper"
            >
              Planejar viagem
            </Link>
          </div>
        ) : (
          <>
            <Mapa
              markers={markers}
              className="h-80 w-full rounded-xl shadow-sm"
              fitBounds
            />
            <p className="mt-3 text-xs text-muted">
              Círculos âmbar maiores = mais buscas recentes envolvendo a parada
              (origem ou destino).
            </p>
          </>
        )}
      </main>
    </div>
  );
}
