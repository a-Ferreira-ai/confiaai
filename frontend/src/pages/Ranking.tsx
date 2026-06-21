import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FaixaConfianca from "../components/FaixaConfianca";
import { fetchRanking } from "../lib/api";
import type { RankingLine } from "../lib/types";

export default function Ranking() {
  const [lines, setLines] = useState<RankingLine[]>([]);
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light text-muted">
        Carregando ranking...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light">
      <header className="border-b border-tint bg-paper px-4 py-4">
        <Link to="/" className="text-sm text-teal hover:underline">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-xl font-bold text-darktxt">Ranking de confiabilidade</h1>
        <p className="mt-1 text-sm text-muted">
          Linhas ordenadas pelo índice de confiança (horário previsto vs realizado).
        </p>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        {error && (
          <p className="mb-4 rounded-lg bg-coral/10 px-4 py-3 text-sm text-coral">{error}</p>
        )}

        {lines.length === 0 ? (
          <p className="text-center text-muted">Nenhuma linha cadastrada.</p>
        ) : (
          <ul className="space-y-3">
            {lines.map((line) => (
              <li key={line.id}>
                <Link
                  to={`/linha/${line.id}`}
                  className="block rounded-xl bg-paper p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                        #{line.rank}
                      </span>
                      <h2 className="text-lg font-semibold text-darktxt">{line.name}</h2>
                      <p className="text-sm text-muted">{line.mode_label}</p>
                    </div>
                    <FaixaConfianca reliability={line.reliability} compact />
                  </div>
                  <FaixaConfianca reliability={line.reliability} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
