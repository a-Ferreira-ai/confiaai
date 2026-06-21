import {
  reliabilityDisplayLabel,
  reliabilityFillPercent,
  reliabilitySemaphoreClass,
} from "../lib/pillarStyles";
import type { Reliability } from "../lib/types";

interface FaixaConfiancaProps {
  reliability: Reliability;
  compact?: boolean;
}

function SemaphoreDot({ level }: { level: Reliability["level"] }) {
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${reliabilitySemaphoreClass(level)}`}
      aria-hidden="true"
    />
  );
}

export default function FaixaConfianca({ reliability, compact = false }: FaixaConfiancaProps) {
  const hasData = reliability.sample_size > 0;
  const label = reliabilityDisplayLabel(reliability);

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
          hasData ? "bg-teal/15 text-teal" : "bg-light text-muted"
        }`}
      >
        {hasData && <SemaphoreDot level={reliability.level} />}
        Confiança: {label}
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-teal">Confiança</span>
        <span
          className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
            hasData ? "text-darktxt" : "text-muted"
          }`}
        >
          {hasData && <SemaphoreDot level={reliability.level} />}
          {label}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-light">
        {hasData && (
          <div
            className={`h-full rounded-full transition-all ${reliabilitySemaphoreClass(reliability.level)}`}
            style={{ width: `${reliabilityFillPercent(reliability.level)}%` }}
          />
        )}
      </div>
      {hasData && reliability.on_time_percent !== null && (
        <p className="text-xs text-muted">
          {reliability.on_time_percent}% no horário · {reliability.sample_size} amostras
        </p>
      )}
    </div>
  );
}
