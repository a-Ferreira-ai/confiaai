import type { Safety } from "../lib/types";

interface IndicadorSegurancaProps {
  safety: Safety;
  variant?: "full" | "selo";
}

function ShieldIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 2.18l6 2.25v4.66c0 3.87-2.55 7.5-6 8.55-3.45-1.05-6-4.68-6-8.55V6.43l6-2.25z" />
    </svg>
  );
}

function safetyDisplayLabel(safety: Safety): string {
  if (safety.sample_size === 0) {
    return "Sem relatos recentes";
  }
  return safety.label;
}

function fillPercent(safety: Safety): number {
  if (safety.sample_size === 0) return 0;

  switch (safety.level) {
    case "high":
      return 100;
    case "medium":
      return 66;
    case "low":
      return 33;
    default:
      return 0;
  }
}

export default function IndicadorSeguranca({ safety, variant = "full" }: IndicadorSegurancaProps) {
  const hasData = safety.sample_size > 0;
  const label = safetyDisplayLabel(safety);
  const width = fillPercent(safety);

  if (variant === "selo") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-coral/30 bg-coral/10 px-3 py-1 text-sm font-medium text-coral">
        <ShieldIcon />
        <span>Selo: {label}</span>
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-coral">
          <ShieldIcon />
          Segurança da parada
        </span>
        <span className={`text-sm font-semibold ${hasData ? "text-darktxt" : "text-muted"}`}>
          {label}
        </span>
      </div>
      {hasData && (
        <div className="h-2 overflow-hidden rounded-full bg-light">
          <div
            className="h-full rounded-full bg-coral transition-all"
            style={{ width: `${width}%` }}
          />
        </div>
      )}
      {hasData && safety.average_severity !== null && (
        <p className="text-xs text-muted">
          Severidade média {safety.average_severity.toFixed(1)} · {safety.sample_size} relatos
        </p>
      )}
    </div>
  );
}
