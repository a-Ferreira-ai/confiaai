import { Link } from "react-router-dom";
import { modeIcon } from "../lib/enrichItems";
import type { LineAtStopEnriched } from "../lib/paradaHelpers";
import FaixaConfianca from "./FaixaConfianca";
import IndicadorOcupacao from "./IndicadorOcupacao";
import TagEstimativa from "./TagEstimativa";

interface LinhaNaParadaRowProps {
  enriched: LineAtStopEnriched;
}

export default function LinhaNaParadaRow({ enriched }: LinhaNaParadaRowProps) {
  const { line, nextDeparture, occupancy } = enriched;

  return (
    <Link
      to={`/linha/${line.id}`}
      className="block rounded-xl border border-tint bg-paper p-4 shadow-sm transition hover:border-teal/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg" aria-hidden>
              {modeIcon(line.mode)}
            </span>
            <h3 className="font-semibold text-darktxt">{line.name}</h3>
            {line.mode === "metro" && <TagEstimativa />}
          </div>
          <p className="mt-1 text-xs uppercase tracking-wide text-muted">{line.mode_label}</p>
        </div>
        <FaixaConfianca reliability={line.reliability} compact />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
        {nextDeparture ? (
          <span>
            Próximo: <span className="font-medium text-darktxt">{nextDeparture}</span>
          </span>
        ) : (
          <span>Próximo horário indisponível</span>
        )}
        <span aria-hidden>·</span>
        <IndicadorOcupacao occupancy={occupancy} compact />
      </div>
    </Link>
  );
}
