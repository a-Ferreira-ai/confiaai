import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BotaoFavorito from "../components/BotaoFavorito";
import BotaoReportar from "../components/BotaoReportar";
import FluxoReporte, { type ReportType } from "../components/FluxoReporte";
import IndicadorSeguranca from "../components/IndicadorSeguranca";
import LinhaNaParadaRow from "../components/LinhaNaParadaRow";
import Mapa, { type MapMarker } from "../components/Mapa";
import PromptGeofence from "../components/PromptGeofence";
import TagEstimativa from "../components/TagEstimativa";
import { fetchStop, fetchStops } from "../lib/api";
import {
  markPrompted,
  trackGeofenceContext,
  type GeofencePromptEvent,
} from "../lib/geofence";
import { findNearbySaferStop, type SaferStopSuggestion } from "../lib/nearbySaferStop";
import { enrichLinesAtStop, type LineAtStopEnriched } from "../lib/paradaHelpers";
import { useReportsChannel } from "../lib/useReportsChannel";
import type { StopDetail } from "../lib/types";

export default function Parada() {
  const { id } = useParams<{ id: string }>();
  const [stop, setStop] = useState<StopDetail | null>(null);
  const [enrichedLines, setEnrichedLines] = useState<LineAtStopEnriched[]>([]);
  const [saferStop, setSaferStop] = useState<SaferStopSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [geofenceEvent, setGeofenceEvent] = useState<GeofencePromptEvent | null>(null);
  const [geofenceReportOpen, setGeofenceReportOpen] = useState(false);
  const [geofenceReportType, setGeofenceReportType] = useState<ReportType>("arrival");

  const loadData = useCallback(async () => {
    if (!id) return;

    const stopData = await fetchStop(id);
    const [lines, safer] = await Promise.all([
      enrichLinesAtStop(stopData),
      findNearbySaferStop(stopData).catch(() => null),
    ]);

    setStop(stopData);
    setEnrichedLines(lines);
    setSaferStop(safer);
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
        cleanupWatch = trackGeofenceContext({
          stops: data.stops,
          defaultKind: "arrival",
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
  }, [id]);

  const mapMarkers = useMemo<MapMarker[]>(() => {
    if (!stop) return [];

    return [
      {
        id: stop.id,
        lat: parseFloat(stop.latitude),
        lng: parseFloat(stop.longitude),
        label: stop.name,
        reliability: stop.reliability,
      },
    ];
  }, [stop]);

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
        Carregando parada...
      </div>
    );
  }

  if (error || !stop) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-darktxt">{error ?? "Parada não encontrada."}</p>
        <Link to="/" className="text-teal underline">
          Voltar ao início
        </Link>
      </div>
    );
  }

  const activeGeofenceEvent =
    geofenceEvent && Number(geofenceEvent.stop.id) === stop.id ? geofenceEvent : null;
  const geofenceLineName = stop.trips[0]?.line_name;

  return (
    <div className="min-h-screen bg-light pb-24">
      <header className="bg-ink px-6 py-8 text-paper">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link to="/" className="text-sm text-on-ink-subtle underline">
            ← Voltar
          </Link>
          <BotaoFavorito
            item={{
              kind: "stop",
              id: stop.id,
              name: stop.name,
              mode: stop.mode,
              mode_label: stop.mode_label,
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm uppercase tracking-widest text-on-ink-tertiary">{stop.mode_label}</p>
          {stop.mode === "metro" && <TagEstimativa />}
        </div>
        <h1 className="text-3xl font-bold">{stop.name}</h1>
        <div className="mt-4">
          <IndicadorSeguranca safety={stop.safety} variant="selo" />
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-6 px-4 py-6">
        {saferStop && (
          <section className="rounded-xl border border-tint bg-tint p-4 shadow-sm">
            <p className="text-sm text-darktxt">
              Esta parada tem relatos recentes de atenção na segurança.
            </p>
            <Link
              to={`/parada/${saferStop.id}`}
              className="mt-2 inline-block text-sm font-semibold text-teal underline"
            >
              Sugerir parada mais segura próxima — {saferStop.name}
            </Link>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-darktxt">Linhas nesta parada</h2>
          {enrichedLines.length === 0 ? (
            <p className="text-muted">Nenhuma linha cadastrada para esta parada.</p>
          ) : (
            enrichedLines.map((enriched) => (
              <LinhaNaParadaRow key={enriched.line.id} enriched={enriched} />
            ))
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-tint bg-paper shadow-sm">
          <Mapa
            markers={mapMarkers}
            center={[parseFloat(stop.latitude), parseFloat(stop.longitude)]}
            zoom={14}
            className="h-48 w-full"
          />
        </section>
      </main>

      <BotaoReportar
        stopId={stop.id}
        stopName={stop.name}
        trips={stop.trips}
        onSuccess={() => loadData().catch((err: Error) => setError(err.message))}
      />

      {activeGeofenceEvent && !geofenceReportOpen && (
        <PromptGeofence
          kind={activeGeofenceEvent.kind}
          stop={activeGeofenceEvent.stop}
          lineName={geofenceLineName}
          onReport={openGeofenceReport}
          onDismiss={dismissGeofencePrompt}
        />
      )}

      {geofenceReportOpen && activeGeofenceEvent && (
        <FluxoReporte
          stopId={stop.id}
          stopName={stop.name}
          trips={stop.trips}
          context="geofence_arrival"
          initialType={geofenceReportType}
          onSuccess={() => {
            markPrompted(activeGeofenceEvent.stop.id);
            loadData().catch((err: Error) => setError(err.message));
          }}
          onClose={dismissGeofencePrompt}
        />
      )}
    </div>
  );
}
