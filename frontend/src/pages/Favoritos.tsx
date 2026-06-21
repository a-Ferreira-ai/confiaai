import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import FaixaConfianca from "../components/FaixaConfianca";
import IndicadorOcupacao from "../components/IndicadorOcupacao";
import TagEstimativa from "../components/TagEstimativa";
import { enrichFavorite, modeIcon, type EnrichedFavorite } from "../lib/enrichItems";
import { getFavoritos } from "../lib/favoritos";
import { NO_DATA_OCCUPANCY, NO_DATA_RELIABILITY } from "../lib/routeHelpers";

export default function Favoritos() {
  const location = useLocation();
  const [entries, setEntries] = useState<EnrichedFavorite[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavoritos = useCallback(async () => {
    const items = getFavoritos();
    if (items.length === 0) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const enriched = await Promise.all(items.map(enrichFavorite));
    setEntries(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFavoritos();
  }, [loadFavoritos, location.key]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <header className="bg-ink px-6 py-6 text-paper">
          <p className="text-sm uppercase tracking-widest text-on-ink-tertiary">Salvos</p>
          <h1 className="text-2xl font-bold">Favoritos</h1>
        </header>
        <div className="flex flex-1 items-center justify-center py-24 text-muted">
          Carregando favoritos...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-ink px-6 py-6 text-paper">
        <p className="text-sm uppercase tracking-widest text-on-ink-tertiary">Salvos</p>
        <h1 className="text-2xl font-bold">Favoritos</h1>
        <p className="mt-1 text-sm text-on-ink-subtle">
          Linhas e paradas marcadas neste dispositivo.
        </p>
      </header>

      <main className="space-y-3 px-4 py-6">
        {entries.length === 0 ? (
          <div className="rounded-xl border border-tint bg-paper p-8 text-center shadow-sm">
            <p className="text-lg font-medium text-darktxt">Nenhum favorito ainda</p>
            <p className="mt-2 text-sm text-muted">
              Toque na estrela em uma parada ou linha para salvar aqui.
            </p>
            <Link
              to="/ranking"
              className="mt-4 inline-block rounded-full bg-sea px-5 py-2 text-sm font-semibold text-paper"
            >
              Explorar linhas
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {entries.map(({ item, reliability, occupancy, error }) => {
              const href = item.kind === "stop" ? `/parada/${item.id}` : `/linha/${item.id}`;
              const kindLabel = item.kind === "stop" ? "Parada" : "Linha";

              return (
                <li key={`${item.kind}-${item.id}`}>
                  <Link
                    to={href}
                    className="block rounded-xl border border-tint bg-paper p-4 shadow-sm transition hover:border-teal/30 hover:shadow-md"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                          {kindLabel}
                          {item.mode_label ? ` · ${item.mode_label}` : ""}
                        </p>
                        <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-darktxt">
                          <span className="mr-1.5" aria-hidden>
                            {modeIcon(item.mode)}
                          </span>
                          {item.name}
                          {item.mode === "metro" && <TagEstimativa />}
                        </h2>
                      </div>
                    </div>

                    {error && (
                      <p className="text-sm text-muted">Não foi possível carregar indicadores.</p>
                    )}
                    <div className="space-y-2">
                      <FaixaConfianca reliability={reliability ?? NO_DATA_RELIABILITY} compact />
                      {item.kind === "stop" && (
                        <IndicadorOcupacao occupancy={occupancy ?? NO_DATA_OCCUPANCY} compact />
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
