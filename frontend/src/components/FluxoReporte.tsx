import { useState } from "react";
import { postReportChegada, postReportOcupacao, postReportParada } from "../lib/api";
import type {
  OccupancyLevel,
  ReportContext,
  StopReportCategory,
  StopTripRef,
} from "../lib/types";

export type ReportType = "safety" | "occupancy" | "arrival";

interface FluxoReporteProps {
  stopId: number;
  stopName: string;
  trips: StopTripRef[];
  context: ReportContext;
  initialType?: ReportType;
  onSuccess: () => void;
  onClose: () => void;
}

const CATEGORY_OPTIONS: { value: StopReportCategory; label: string }[] = [
  { value: "iluminacao", label: "Iluminação" },
  { value: "infraestrutura", label: "Infraestrutura" },
  { value: "seguranca_geral", label: "Segurança geral" },
];

const OCCUPANCY_OPTIONS: { value: OccupancyLevel; label: string }[] = [
  { value: "free", label: "Livre" },
  { value: "moderate", label: "Moderado" },
  { value: "crowded", label: "Cheio" },
  { value: "packed", label: "Lotado" },
];

export default function FluxoReporte({
  stopId,
  stopName,
  trips,
  context,
  initialType = "occupancy",
  onSuccess,
  onClose,
}: FluxoReporteProps) {
  const [reportType, setReportType] = useState<ReportType>(initialType);
  const [category, setCategory] = useState<StopReportCategory>("seguranca_geral");
  const [severity, setSeverity] = useState(2);
  const [level, setLevel] = useState<OccupancyLevel>("moderate");
  const [tripId, setTripId] = useState<number>(trips[0]?.id ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTrip = trips.find((trip) => trip.id === tripId) ?? trips[0];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (reportType === "safety") {
        await postReportParada({ stop_id: stopId, category, severity, context });
      } else if (reportType === "occupancy") {
        if (!selectedTrip) {
          throw new Error("Nenhuma viagem disponível para esta parada.");
        }
        await postReportOcupacao({
          stop_id: stopId,
          trip_id: selectedTrip.id,
          level,
          context,
        });
      } else {
        if (!selectedTrip?.scheduled_at) {
          throw new Error("Horário previsto indisponível para esta viagem.");
        }
        await postReportChegada({
          stop_id: stopId,
          trip_id: selectedTrip.id,
          scheduled_at: selectedTrip.scheduled_at,
          observed_at: new Date().toISOString(),
          context,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar relato.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-4 sm:items-center">
      <div
        className="w-full max-w-lg rounded-t-2xl bg-paper p-6 shadow-xl sm:rounded-2xl"
        role="dialog"
        aria-labelledby="fluxo-reporte-title"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="fluxo-reporte-title" className="text-lg font-semibold text-darktxt">
              Reportar
            </h2>
            <p className="text-sm text-muted">{stopName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted hover:bg-light"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          {(
            [
              { id: "occupancy" as const, label: "Ocupação" },
              { id: "safety" as const, label: "Segurança" },
              { id: "arrival" as const, label: "Chegada" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setReportType(tab.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                reportType === tab.id
                  ? tab.id === "safety"
                    ? "bg-coral text-paper"
                    : tab.id === "occupancy"
                      ? "bg-amber text-darktxt"
                      : "bg-teal text-paper"
                  : "bg-light text-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {trips.length > 1 && reportType !== "safety" && (
            <label className="block space-y-1">
              <span className="text-sm font-medium text-darktxt">Viagem</span>
              <select
                value={tripId}
                onChange={(e) => setTripId(Number(e.target.value))}
                className="w-full rounded-lg border border-tint bg-light px-3 py-2 text-sm text-darktxt"
              >
                {trips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.line_name} · {trip.headsign}
                  </option>
                ))}
              </select>
            </label>
          )}

          {reportType === "safety" && (
            <>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-darktxt">Categoria</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as StopReportCategory)}
                  className="w-full rounded-lg border border-tint bg-light px-3 py-2 text-sm text-darktxt"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-darktxt">Gravidade</legend>
                <div className="flex gap-2">
                  {[1, 2, 3].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSeverity(value)}
                      className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                        severity === value
                          ? "bg-coral text-paper"
                          : "bg-light text-muted hover:bg-tint"
                      }`}
                    >
                      {value === 1 ? "Leve" : value === 2 ? "Média" : "Alta"}
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          {reportType === "occupancy" && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-darktxt">Nível de ocupação</legend>
              <div className="grid grid-cols-2 gap-2">
                {OCCUPANCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLevel(opt.value)}
                    className={`rounded-lg py-2 text-sm font-medium transition ${
                      level === opt.value
                        ? "bg-amber text-darktxt"
                        : "bg-light text-muted hover:bg-tint"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {reportType === "arrival" && selectedTrip?.scheduled_at && (
            <p className="rounded-lg bg-light px-3 py-2 text-sm text-muted">
              Horário previsto:{" "}
              {new Date(selectedTrip.scheduled_at).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              . Registraremos sua chegada agora.
            </p>
          )}

          {error && <p className="text-sm text-coral">{error}</p>}

          <button
            type="submit"
            disabled={submitting || (reportType !== "safety" && trips.length === 0)}
            className="w-full rounded-full bg-sea py-3 text-sm font-semibold text-paper transition hover:bg-sea/90 disabled:opacity-50"
          >
            {submitting ? "Enviando..." : "Enviar relato"}
          </button>
        </form>
      </div>
    </div>
  );
}
