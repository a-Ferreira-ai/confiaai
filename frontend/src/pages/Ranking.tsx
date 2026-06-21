import { useEffect, useMemo, useState } from "react";
import CardRankingLinha from "../components/CardRankingLinha";
import { fetchRanking } from "../lib/api";
import type { RankingLine, TransportMode } from "../lib/types";

const MODE_CHIPS: { value: TransportMode | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "bus", label: "Ônibus" },
  { value: "metro", label: "Metrô" },
];

export default function Ranking() {
  const [lines, setLines] = useState<RankingLine[]>([]);
  const [modeFilter, setModeFilter] = useState<TransportMode | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchRanking()
      .then((data) => {
        if (cancelled) return;
        setLines(data.lines);
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

  const filteredLines = useMemo(
    () => (modeFilter ? lines.filter((line) => line.mode === modeFilter) : lines),
    [lines, modeFilter],
  );

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-muted">
        Carregando ranking...
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-ink px-6 py-6 text-paper">
        <p className="text-sm uppercase tracking-widest text-on-ink-tertiary">Confiabilidade</p>
        <h1 className="text-2xl font-bold">Ranking de linhas</h1>
        <p className="mt-1 text-sm text-on-ink-subtle">
          Linhas ordenadas pelo índice de confiança (horário previsto vs realizado).
        </p>
      </header>

      <div className="bg-ink px-6 pb-4">
        <div className="flex flex-wrap gap-2">
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
      </div>

      <main className="mx-auto max-w-lg px-4 py-6">
        {error && (
          <p className="mb-4 rounded-lg border border-tint bg-light px-4 py-3 text-sm text-darktxt">{error}</p>
        )}

        {lines.length === 0 ? (
          <p className="text-center text-muted">Nenhuma linha cadastrada.</p>
        ) : filteredLines.length === 0 ? (
          <p className="text-center text-muted">
            Nenhuma linha de{" "}
            {modeFilter === "bus" ? "ônibus" : modeFilter === "metro" ? "metrô" : "transporte"} no
            ranking.
          </p>
        ) : (
          <ul className="space-y-3">
            {filteredLines.map((line) => (
              <li key={line.id}>
                <CardRankingLinha line={line} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
