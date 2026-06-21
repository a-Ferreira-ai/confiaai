import type { Safety } from "../lib/types";

interface IndicadorSegurancaProps {
  safety: Safety;
  compact?: boolean;
}

const levelStyles: Record<
  Safety["level"] | "no_data",
  { bar: string; text: string; badge: string }
> = {
  high: {
    bar: "bg-teal",
    text: "text-teal",
    badge: "bg-teal/20 text-teal",
  },
  medium: {
    bar: "bg-amber",
    text: "text-amber",
    badge: "bg-amber/20 text-amber",
  },
  low: {
    bar: "bg-coral",
    text: "text-coral",
    badge: "bg-coral/20 text-coral",
  },
  no_data: {
    bar: "bg-muted/40",
    text: "text-muted",
    badge: "bg-light text-muted",
  },
};

function resolveStyle(safety: Safety) {
  if (safety.sample_size === 0) {
    return levelStyles.no_data;
  }
  return levelStyles[safety.level];
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

export default function IndicadorSeguranca({ safety, compact = false }: IndicadorSegurancaProps) {
  const style = resolveStyle(safety);
  const width = fillPercent(safety);

  if (compact) {
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${style.badge}`}>
        Segurança: {safety.label}
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-darktxt">Segurança da parada</span>
        <span className={`text-sm font-semibold ${style.text}`}>{safety.label}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-light">
        <div
          className={`h-full rounded-full transition-all ${style.bar}`}
          style={{ width: `${width}%` }}
        />
      </div>
      {safety.sample_size > 0 && safety.average_severity !== null && (
        <p className="text-xs text-muted">
          Severidade média {safety.average_severity.toFixed(1)} · {safety.sample_size} relatos
        </p>
      )}
      {safety.sample_size === 0 && (
        <p className="text-xs text-muted">Ainda não há relatos de segurança para esta parada.</p>
      )}
    </div>
  );
}
