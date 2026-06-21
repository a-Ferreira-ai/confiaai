import type { Occupancy, OccupancyLevel } from "../lib/types";

interface IndicadorOcupacaoProps {
  occupancy: Occupancy;
  compact?: boolean;
}

const LEVEL_FILL_COUNT: Record<OccupancyLevel, number> = {
  free: 1,
  moderate: 2,
  crowded: 3,
  packed: 4,
};

const AMBER_OPACITIES = [0.35, 0.55, 0.75, 1] as const;

function occupancyDisplayLabel(occupancy: Occupancy): string {
  if (occupancy.sample_size === 0) {
    return "ocupação desconhecida";
  }
  return occupancy.label;
}

function PeopleIcon({ filledCount, size = 16 }: { filledCount: number; size?: number }) {
  const figure = (index: number) => {
    const opacity = index < filledCount ? AMBER_OPACITIES[filledCount - 1] : 0.2;
    const x = index * 5;
    return (
      <g key={index} transform={`translate(${x}, 0)`} opacity={opacity}>
        <circle cx="3" cy="2.5" r="2" fill="#E9A23B" />
        <path d="M0.5 8 Q3 5.5 5.5 8" stroke="#E9A23B" strokeWidth="1.2" fill="none" />
      </g>
    );
  };

  return (
    <svg
      width={size + 12}
      height={size}
      viewBox="0 0 20 10"
      aria-hidden="true"
      className="shrink-0"
    >
      {[0, 1, 2, 3].map(figure)}
    </svg>
  );
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
  const hasData = occupancy.sample_size > 0;
  const label = occupancyDisplayLabel(occupancy);
  const filledCount = hasData ? LEVEL_FILL_COUNT[occupancy.level] : 0;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
          hasData ? "bg-amber/20 text-amber" : "bg-light text-muted"
        }`}
      >
        {hasData && <PeopleIcon filledCount={filledCount} size={12} />}
        Ocupação: {label}
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-amber">Ocupação</span>
        <span
          className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
            hasData ? "text-darktxt" : "text-muted"
          }`}
        >
          {hasData && <PeopleIcon filledCount={filledCount} />}
          {label}
        </span>
      </div>
      {hasData && (
        <div className="flex items-center gap-2">
          <PeopleIcon filledCount={filledCount} size={20} />
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-light">
            <div
              className="h-full rounded-full bg-amber transition-all"
              style={{ width: `${filledCount * 25}%`, opacity: AMBER_OPACITIES[filledCount - 1] }}
            />
          </div>
        </div>
      )}
      {hasData && occupancy.source_label && occupancy.recorded_at && (
        <p className="text-xs text-muted">
          Fonte: {occupancy.source_label} · {formatRelativeTime(occupancy.recorded_at)}
        </p>
      )}
    </div>
  );
}
