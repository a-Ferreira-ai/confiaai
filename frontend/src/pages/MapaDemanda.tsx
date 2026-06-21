import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MapaDemandaMap from "../components/MapaDemandaMap";
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

  const heatmapPoints = useMemo(
    () =>
      points.map((point) => ({
        lat: parseFloat(point.latitude),
        lng: parseFloat(point.longitude),
        intensity: point.intensity,
      })),
    [points],
  );

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-muted">
        Carregando mapa de demanda...
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 bg-ink px-6 py-6 text-paper">
        <p className="text-sm uppercase tracking-widest text-on-ink-tertiary">Explorar</p>
        <h1 className="text-2xl font-bold">Mapa de demanda</h1>
        <p className="mt-1 text-sm text-on-ink-subtle">
          Buscas origem→destino nos últimos {windowDays} dias ({totalSearches}{" "}
          {totalSearches === 1 ? "busca" : "buscas"}).
        </p>
      </header>

      {error && (
        <p className="mx-4 mt-4 shrink-0 rounded-lg border border-tint bg-light px-4 py-3 text-sm text-darktxt">
          {error}
        </p>
      )}

      {points.length === 0 ? (
        <main className="flex flex-1 items-center justify-center px-4 py-6">
          <div className="w-full rounded-xl bg-paper p-6 text-center shadow-sm">
            <p className="text-darktxt">Ainda não há buscas registradas.</p>
            <p className="mt-2 text-sm text-muted">
              Planeje uma viagem em Busca para alimentar o mapa de calor.
            </p>
            <Link
              to="/"
              className="mt-4 inline-block rounded-full bg-sea px-5 py-2 text-sm font-semibold text-paper"
            >
              Planejar viagem
            </Link>
          </div>
        </main>
      ) : (
        <>
          <MapaDemandaMap points={heatmapPoints} className="min-h-[50vh] flex-1" />
          <p className="shrink-0 px-4 py-2 text-xs text-muted">
            Calor âmbar mais intenso = mais buscas recentes envolvendo a parada (origem ou
            destino).
          </p>
        </>
      )}
    </div>
  );
}
