import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BotaoFavorito from "../components/BotaoFavorito";
import BotaoReportar from "../components/BotaoReportar";
import CardParada from "../components/CardParada";
import FaixaConfianca from "../components/FaixaConfianca";
import GraficoOcupacaoLinha from "../components/GraficoOcupacaoLinha";
import TagEstimativa from "../components/TagEstimativa";
import { fetchLine, fetchRanking, fetchStop } from "../lib/api";
import { buildLineOccupancyProfile } from "../lib/lineOccupancyProfile";
import { findLineRank, rankBadgeText } from "../lib/lineRank";
import { useReportsChannel } from "../lib/useReportsChannel";
import type { LineDetail, StopTripRef } from "../lib/types";

export default function Linha() {
  const { id } = useParams<{ id: string }>();
  const [line, setLine] = useState<LineDetail | null>(null);
  const [rankLabel, setRankLabel] = useState<string | null>(null);
  const [reportStopId, setReportStopId] = useState<number | null>(null);
  const [reportStopName, setReportStopName] = useState("");
  const [reportTrips, setReportTrips] = useState<StopTripRef[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const stopIdsRef = useRef<Set<number>>(new Set());

  const loadData = useCallback(async () => {
    if (!id) return;

    const [lineData, rankingData] = await Promise.all([fetchLine(id), fetchRanking()]);
    setLine(lineData);
    stopIdsRef.current = new Set(lineData.stops.map((stop) => stop.id));

    const rankEntry = findLineRank(rankingData.lines, lineData.id);
    setRankLabel(rankBadgeText(rankEntry));

    const firstStop = lineData.stops[0];
    if (firstStop) {
      const stopDetail = await fetchStop(firstStop.id);
      setReportStopId(stopDetail.id);
      setReportStopName(stopDetail.name);
      setReportTrips(stopDetail.trips);
    } else {
      setReportStopId(null);
      setReportStopName("");
      setReportTrips([]);
    }

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
    onReport: (payload) => {
      if (!stopIdsRef.current.has(payload.stop_id)) return;
      loadData().catch((err: Error) => setError(err.message));
    },
  });

  const occupancyBuckets = useMemo(
    () => (line ? buildLineOccupancyProfile(line.id, line.mode) : []),
    [line],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light text-muted">
        Carregando linha...
      </div>
    );
  }

  if (error || !line) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-darktxt">{error ?? "Linha não encontrada."}</p>
        <Link to="/" className="text-teal underline">
          Voltar ao início
        </Link>
      </div>
    );
  }

  const lineColor = line.color ?? "#12849A";
  const showReportFab = reportStopId !== null && reportTrips.length > 0;

  return (
    <div className="min-h-screen bg-light pb-24">
      <header className="bg-ink px-6 py-8 text-paper">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link to="/ranking" className="text-sm text-on-ink-subtle underline">
            ← Ranking
          </Link>
          <BotaoFavorito
            item={{
              kind: "line",
              id: line.id,
              name: line.name,
              mode: line.mode,
              mode_label: line.mode_label,
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: lineColor }}
            aria-hidden
          />
          <p className="text-sm uppercase tracking-widest text-on-ink-tertiary">{line.mode_label}</p>
          {line.mode === "metro" && <TagEstimativa />}
        </div>

        <h1 className="mt-1 text-3xl font-bold">{line.name}</h1>

        {rankLabel && (
          <p className="mt-3 text-sm font-medium text-on-ink-muted">{rankLabel}</p>
        )}

        <div className="mt-6 rounded-xl bg-ink2 p-4">
          <FaixaConfianca reliability={line.reliability} />
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-6 px-4 py-6">
        <GraficoOcupacaoLinha buckets={occupancyBuckets} mode={line.mode} />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-darktxt">Paradas</h2>
          {line.stops.length === 0 ? (
            <p className="text-muted">Nenhuma parada cadastrada para esta linha.</p>
          ) : (
            line.stops.map((stop) => <CardParada key={stop.id} stop={stop} />)
          )}
        </section>
      </main>

      {showReportFab && (
        <BotaoReportar
          stopId={reportStopId}
          stopName={reportStopName}
          trips={reportTrips}
          onSuccess={() => loadData().catch((err: Error) => setError(err.message))}
        />
      )}
    </div>
  );
}
