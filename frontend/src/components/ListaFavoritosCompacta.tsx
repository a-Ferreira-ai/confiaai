import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FaixaConfianca from "./FaixaConfianca";
import IndicadorOcupacao from "./IndicadorOcupacao";
import TagEstimativa from "./TagEstimativa";
import { enrichFavorite, modeIcon, type EnrichedFavorite } from "../lib/enrichItems";
import { getFavoritos } from "../lib/favoritos";
import { NO_DATA_OCCUPANCY, NO_DATA_RELIABILITY } from "../lib/routeHelpers";

interface ListaFavoritosCompactaProps {
  limit?: number;
  showViewAll?: boolean;
  refreshKey?: string;
}

export default function ListaFavoritosCompacta({
  limit = 5,
  showViewAll = true,
  refreshKey,
}: ListaFavoritosCompactaProps) {
  const [entries, setEntries] = useState<EnrichedFavorite[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavoritos = useCallback(async () => {
    const items = getFavoritos().slice(0, limit);
    if (items.length === 0) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const enriched = await Promise.all(items.map(enrichFavorite));
    setEntries(enriched);
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    loadFavoritos();
  }, [loadFavoritos, refreshKey]);

  if (loading) {
    return <p className="text-sm text-muted">Carregando favoritos...</p>;
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl bg-light px-4 py-3">
        <p className="text-sm text-muted">Nenhum favorito — explore o ranking.</p>
        <Link to="/ranking" className="mt-2 inline-block text-sm font-medium text-teal underline">
          Ver ranking
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {entries.map(({ item, reliability, occupancy, error }) => {
          const href = item.kind === "stop" ? `/parada/${item.id}` : `/linha/${item.id}`;

          return (
            <li key={`${item.kind}-${item.id}`}>
              <Link
                to={href}
                className="block rounded-xl border border-tint bg-paper px-4 py-3 shadow-sm transition hover:border-teal/30"
              >
                <p className="flex flex-wrap items-center gap-2 font-medium text-darktxt">
                  <span className="mr-1.5" aria-hidden>
                    {modeIcon(item.mode)}
                  </span>
                  {item.name}
                  {item.mode === "metro" && <TagEstimativa />}
                </p>
                {error && (
                  <p className="mt-1 text-xs text-muted">Indicadores indisponíveis.</p>
                )}
                <div className="mt-2 space-y-1">
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
      {showViewAll && getFavoritos().length > 0 && (
        <Link to="/favoritos" className="inline-block text-sm font-medium text-teal underline">
          Ver todos
        </Link>
      )}
    </div>
  );
}
