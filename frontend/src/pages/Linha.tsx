import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CardParada from "../components/CardParada";
import FaixaConfianca from "../components/FaixaConfianca";
import { fetchLine } from "../lib/api";
import { useReportsChannel } from "../lib/useReportsChannel";
import type { LineDetail } from "../lib/types";

export default function Linha() {
  const { id } = useParams<{ id: string }>();
  const [line, setLine] = useState<LineDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const stopIdsRef = useRef<Set<number>>(new Set());

  const loadData = useCallback(async () => {
    if (!id) return;

    const data = await fetchLine(id);
    setLine(data);
    stopIdsRef.current = new Set(data.stops.map((stop) => stop.id));
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
        <p className="text-coral">{error ?? "Linha não encontrada."}</p>
        <Link to="/" className="text-teal underline">
          Voltar ao início
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light">
      <header
        className="px-6 py-8 text-paper"
        style={{ backgroundColor: line.color ?? "#12849A" }}
      >
        <Link to="/" className="mb-4 inline-block text-sm text-paper/80 underline">
          ← Início
        </Link>
        <p className="text-sm uppercase tracking-widest text-paper/70">{line.mode_label}</p>
        <h1 className="text-3xl font-bold">{line.name}</h1>
        <div className="mt-6 rounded-xl bg-paper/10 p-4 backdrop-blur-sm">
          <FaixaConfianca reliability={line.reliability} />
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <h2 className="text-lg font-semibold text-darktxt">Paradas</h2>
        {line.stops.length === 0 ? (
          <p className="text-muted">Nenhuma parada cadastrada para esta linha.</p>
        ) : (
          line.stops.map((stop) => <CardParada key={stop.id} stop={stop} />)
        )}
      </main>
    </div>
  );
}
