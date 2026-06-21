import type { Occupancy } from "../lib/types";

interface IndicadorOcupacaoProps {
  occupancy: Occupancy;
  compact?: boolean;
}

const levelStyles: Record<
  Occupancy["level"] | "no_data",
  { bar: string; text: string; badge: string }
> = {
  free: {
    bar: "bg-amber/40",
    text: "text-amber",
    badge: "bg-amber/20 text-amber",
  },
  moderate: {
    bar: "bg-amber/70",
    text: "text-amber",
    badge: "bg-amber/20 text-amber",
  },
  crowded: {
    bar: "bg-amber",
    text: "text-amber",
    badge: "bg-amber/30 text-darktxt",
  },
  packed: {
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

function resolveStyle(occupancy: Occupancy) {
  if (occupancy.sample_size === 0) {
    return levelStyles.no_data;
  }
  return levelStyles[occupancy.level];
}

function fillPercent(occupancy: Occupancy): number {
  if (occupancy.sample_size === 0) return 0;

  switch (occupancy.level) {
    case "free":
      return 25;
    case "moderate":
      return 50;
    case "crowded":
      return 75;
    case "packed":
      return 100;
    default:
      return 0;
  }
}

function formatRelativeTime(isoDate: string): string {
  const recorded = new Date(isoDate);
  const diffMs = Date.now() - recorded.getTime();
  const diffMinutes = Math.round(diffMs / 60_000);

  if (diffMinutes < 1) return "agora";
  if (diffMinutes === 1) return "há 1 min";
  if (diffMinutes < 60) return `há ${diffMinutes} min`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours === 1) return "há 1 h";
  return `há ${diffHours} h`;
}

export default function IndicadorOcupacao({ occupancy, compact = false }: IndicadorOcupacaoProps) {
  const style = resolveStyle(occupancy);
  const width = fillPercent(occupancy);

  if (compact) {
    return (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${style.badge}`}>
        Ocupação: {occupancy.label}
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-darktxt">Ocupação</span>
        <span className={`text-sm font-semibold ${style.text}`}>{occupancy.label}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-light">
        <div
          className={`h-full rounded-full transition-all ${style.bar}`}
          style={{ width: `${width}%` }}
        />
      </div>
      {occupancy.sample_size > 0 && occupancy.source_label && occupancy.recorded_at && (
        <p className="text-xs text-muted">
          Fonte: {occupancy.source_label} · {formatRelativeTime(occupancy.recorded_at)}
        </p>
      )}
      {occupancy.sample_size === 0 && (
        <p className="text-xs text-muted">Ainda não há leituras de ocupação para esta parada.</p>
      )}
    </div>
  );
}
