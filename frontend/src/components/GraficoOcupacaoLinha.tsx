import TagEstimativa from "./TagEstimativa";
import type { OccupancyHourBucket } from "../lib/lineOccupancyProfile";
import type { TransportMode } from "../lib/types";

interface GraficoOcupacaoLinhaProps {
  buckets: OccupancyHourBucket[];
  mode: TransportMode;
}

export default function GraficoOcupacaoLinha({ buckets, mode }: GraficoOcupacaoLinhaProps) {
  const maxIntensity = Math.max(...buckets.map((bucket) => bucket.intensity), 0.1);

  return (
    <section className="rounded-xl border border-tint bg-paper p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-darktxt">Ocupação típica</h2>
        {mode === "metro" && <TagEstimativa />}
      </div>
      <p className="mb-4 text-sm text-muted">Ocupação típica estimada ao longo do dia</p>

      <div
        className="flex h-36 items-end justify-between gap-1 border-b border-chart-grid px-1 pb-1"
        role="img"
        aria-label="Gráfico de ocupação típica por horário"
      >
        {buckets.map((bucket) => {
          const heightPercent = Math.round((bucket.intensity / maxIntensity) * 100);

          return (
            <div key={bucket.hour} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="flex h-28 w-full items-end justify-center">
                <div
                  className="w-full max-w-[1.75rem] rounded-t bg-amber/90"
                  style={{ height: `${heightPercent}%` }}
                  title={`${bucket.label}: ${Math.round(bucket.intensity * 100)}%`}
                />
              </div>
              <span className="text-[10px] font-medium text-muted">{bucket.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
