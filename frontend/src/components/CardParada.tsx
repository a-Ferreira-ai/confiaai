import { Link } from "react-router-dom";
import FaixaConfianca from "./FaixaConfianca";
import TagEstimativa from "./TagEstimativa";
import type { StopSummary } from "../lib/types";

interface CardParadaProps {
  stop: StopSummary;
}

function formatDelay(seconds: number | null): string | null {
  if (seconds === null) return null;
  const minutes = Math.round(seconds / 60);
  if (minutes === 0) return "No horário";
  return `Atraso mediano: ${minutes} min`;
}

export default function CardParada({ stop }: CardParadaProps) {
  const delayLabel = formatDelay(stop.reliability.median_delay_seconds);

  return (
    <Link
      to={`/parada/${stop.id}`}
      className="block rounded-xl border border-tint bg-paper p-4 shadow-sm transition hover:border-teal/30"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-darktxt">{stop.name}</h3>
          <p className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-muted">
            <span>{stop.mode_label}</span>
            {stop.mode === "metro" && <TagEstimativa />}
          </p>
        </div>
        <FaixaConfianca reliability={stop.reliability} compact />
      </div>
      {delayLabel && <p className="text-sm text-muted">{delayLabel}</p>}
    </Link>
  );
}
