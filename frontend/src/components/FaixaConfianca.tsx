import type { Reliability } from "../lib/types";

interface FaixaConfiancaProps {
  reliability: Reliability;
  compact?: boolean;
}

const levelStyles: Record<
  Reliability["level"] | "no_data",
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

function resolveStyle(reliability: Reliability) {
  if (reliability.sample_size === 0) {
    return levelStyles.no_data;
  }
  return levelStyles[reliability.level];
}

export default function FaixaConfianca({ reliability, compact = false }: FaixaConfiancaProps) {
  const style = resolveStyle(reliability);
  const fillPercent =
    reliability.sample_size === 0
      ? 0
      : reliability.level === "high"
        ? 100
        : reliability.level === "medium"
          ? 66
          : 33;

  if (compact) {
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${style.badge}`}>
        Confiança: {reliability.label}
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-darktxt">Confiança</span>
        <span className={`text-sm font-semibold ${style.text}`}>{reliability.label}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-light">
        <div
          className={`h-full rounded-full transition-all ${style.bar}`}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
      {reliability.sample_size > 0 && reliability.on_time_percent !== null && (
        <p className="text-xs text-muted">
          {reliability.on_time_percent}% no horário · {reliability.sample_size} amostras
        </p>
      )}
      {reliability.sample_size === 0 && (
        <p className="text-xs text-muted">Ainda não há dados de chegada para este trecho.</p>
      )}
    </div>
  );
}
