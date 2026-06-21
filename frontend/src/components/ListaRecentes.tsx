import { useCallback, useEffect, useState } from "react";
import FaixaConfianca from "./FaixaConfianca";
import IndicadorOcupacao from "./IndicadorOcupacao";
import { enrichRecent, type EnrichedRecent } from "../lib/enrichItems";
import { getRecentes } from "../lib/recentes";
import { NO_DATA_OCCUPANCY, NO_DATA_RELIABILITY } from "../lib/routeHelpers";

interface ListaRecentesProps {
  limit?: number;
  refreshKey?: string;
  onSelect?: (originId: string, destinationId: string) => void;
}

export default function ListaRecentes({
  limit = 5,
  refreshKey,
  onSelect,
}: ListaRecentesProps) {
  const [entries, setEntries] = useState<EnrichedRecent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecentes = useCallback(async () => {
    const items = getRecentes().slice(0, limit);
    if (items.length === 0) {
      setEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const enriched = await Promise.all(items.map(enrichRecent));
    setEntries(enriched);
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    loadRecentes();
  }, [loadRecentes, refreshKey]);

  if (loading) {
    return <p className="text-sm text-muted">Carregando recentes...</p>;
  }

  if (entries.length === 0) {
    return (
      <p className="rounded-xl bg-light px-4 py-3 text-sm text-muted">
        Suas buscas recentes aparecerão aqui.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry) => (
        <li key={`${entry.originId}-${entry.destinationId}-${entry.modeFilter}`}>
          <button
            type="button"
            onClick={() => onSelect?.(String(entry.originId), String(entry.destinationId))}
            className="w-full rounded-xl border border-tint bg-paper px-4 py-3 text-left shadow-sm transition hover:border-teal/30"
          >
            <p className="font-medium text-darktxt">
              {entry.originName}
              <span className="mx-1.5 text-muted">→</span>
              {entry.destinationName}
            </p>
            {entry.error && (
              <p className="mt-1 text-xs text-muted">Indicadores indisponíveis.</p>
            )}
            <div className="mt-2 space-y-1">
              <FaixaConfianca reliability={entry.reliability ?? NO_DATA_RELIABILITY} compact />
              <IndicadorOcupacao occupancy={entry.occupancy ?? NO_DATA_OCCUPANCY} compact />
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
