import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BotaoReportar from "../components/BotaoReportar";
import FaixaConfianca from "../components/FaixaConfianca";
import FluxoReporte from "../components/FluxoReporte";
import IndicadorOcupacao from "../components/IndicadorOcupacao";
import IndicadorSeguranca from "../components/IndicadorSeguranca";
import Mapa, { type MapMarker } from "../components/Mapa";
import PromptGeofence from "../components/PromptGeofence";
import { fetchOccupancy, fetchStop, fetchStops } from "../lib/api";
import { markPrompted, watchNearStop, type GeofenceStop } from "../lib/geofence";
import { useReportsChannel } from "../lib/useReportsChannel";
import type { Occupancy, StopDetail } from "../lib/types";

export default function Parada() {
  const { id } = useParams<{ id: string }>();
  const [stop, setStop] = useState<StopDetail | null>(null);
  const [occupancy, setOccupancy] = useState<Occupancy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [geofenceStop, setGeofenceStop] = useState<GeofenceStop | null>(null);
  const [geofenceReportOpen, setGeofenceReportOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;

    const [stopData, occupancyData] = await Promise.all([fetchStop(id), fetchOccupancy(id)]);
    setStop(stopData);
    setOccupancy(occupancyData.occupancy);
    setError(null);
  }, [id]);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoading(true);

    loadData()
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, loadData]);

  useReportsChannel({
    stopId: id,
    onReport: () => {
      loadData().catch((err: Error) => setError(err.message));
    },
  });

  useEffect(() => {
    let cleanupWatch: (() => void) | undefined;

    fetchStops()
      .then((data) => {
        cleanupWatch = watchNearStop(data.stops, (nearStop) => {
          setGeofenceStop(nearStop);
        });
      })
      .catch(() => {});

    return () => {
      cleanupWatch?.();
    };
  }, [id]);

  const mapMarkers = useMemo<MapMarker[]>(() => {
    if (!stop) return [];

    return [
      {
        id: stop.id,
        lat: parseFloat(stop.latitude),
        lng: parseFloat(stop.longitude),
        label: stop.name,
        variant: stop.mode,
      },
    ];
  }, [stop]);

  function dismissGeofencePrompt() {
    if (geofenceStop) markPrompted(geofenceStop.id);
    setGeofenceStop(null);
    setGeofenceReportOpen(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light text-muted">
        Carregando parada...
      </div>
    );
  }

  if (error || !stop || !occupancy) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-coral">{error ?? "Parada não encontrada."}</p>
        <Link to="/" className="text-teal underline">
          Voltar ao início
        </Link>
      </div>
    );
  }

  const activeGeofenceStop =
    geofenceStop && Number(geofenceStop.id) === stop.id ? geofenceStop : null;

  return (
    <div className="min-h-screen bg-light pb-24">
      <header className="bg-ink px-6 py-8 text-paper">
        <Link to="/" className="mb-4 inline-block text-sm text-[#9FC6CC] underline">
          ← Início
        </Link>
        <p className="text-sm uppercase tracking-widest text-[#7FA9AF]">{stop.mode_label}</p>
        <h1 className="text-3xl font-bold">{stop.name}</h1>
        <div className="mt-6 rounded-xl bg-ink-light p-4">
          <FaixaConfianca reliability={stop.reliability} />
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-6 px-4 py-6">
        <section className="overflow-hidden rounded-xl border border-tint bg-paper shadow-sm">
          <Mapa
            markers={mapMarkers}
            center={[parseFloat(stop.latitude), parseFloat(stop.longitude)]}
            zoom={14}
            className="h-56 w-full"
          />
        </section>

        <section className="rounded-xl border border-tint bg-paper p-4 shadow-sm">
          <IndicadorOcupacao occupancy={occupancy} />
        </section>

        <section className="rounded-xl border border-coral/20 bg-paper p-4 shadow-sm">
          <IndicadorSeguranca safety={stop.safety} />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-darktxt">Linhas nesta parada</h2>
          {stop.lines.length === 0 ? (
            <p className="text-muted">Nenhuma linha cadastrada para esta parada.</p>
          ) : (
            stop.lines.map((line) => (
              <Link
                key={line.id}
                to={`/linha/${line.id}`}
                className="flex items-center justify-between rounded-xl border border-tint bg-paper p-4 shadow-sm transition hover:border-teal/30"
              >
                <div>
                  <h3 className="font-semibold text-darktxt">{line.name}</h3>
                  <p className="text-xs uppercase tracking-wide text-muted">{line.mode_label}</p>
                </div>
                <FaixaConfianca reliability={line.reliability} compact />
              </Link>
            ))
          )}
        </section>
      </main>

      <BotaoReportar
        stopId={stop.id}
        stopName={stop.name}
        trips={stop.trips}
        onSuccess={() => loadData().catch((err: Error) => setError(err.message))}
      />

      {activeGeofenceStop && !geofenceReportOpen && (
        <PromptGeofence
          stop={activeGeofenceStop}
          onReport={() => setGeofenceReportOpen(true)}
          onDismiss={dismissGeofencePrompt}
        />
      )}

      {geofenceReportOpen && activeGeofenceStop && (
        <FluxoReporte
          stopId={stop.id}
          stopName={stop.name}
          trips={stop.trips}
          context="geofence_arrival"
          initialType="occupancy"
          onSuccess={() => {
            markPrompted(activeGeofenceStop.id);
            loadData().catch((err: Error) => setError(err.message));
          }}
          onClose={dismissGeofencePrompt}
        />
      )}
    </div>
  );
}
