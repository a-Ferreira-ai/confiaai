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

const TABS: { id: ReportType; label: string }[] = [
  { id: "arrival", label: "Horário" },
  { id: "occupancy", label: "Ocupação" },
  { id: "safety", label: "Segurança" },
];

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

const TIME_OFFSET_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 5, label: "Há 5 min" },
  { minutes: 10, label: "Há 10 min" },
  { minutes: 15, label: "Há 15 min" },
];

function tabActiveClass(tabId: ReportType): string {
  if (tabId === "safety") return "bg-coral text-paper";
  if (tabId === "occupancy") return "bg-amber text-darktxt";
  return "bg-teal text-paper";
}

export default function FluxoReporte({
  stopId,
  stopName,
  trips,
  context,
  initialType = "arrival",
  onSuccess,
  onClose,
}: FluxoReporteProps) {
  const [reportType, setReportType] = useState<ReportType>(initialType);
  const [category, setCategory] = useState<StopReportCategory>("seguranca_geral");
  const [severity, setSeverity] = useState(2);
  const [level, setLevel] = useState<OccupancyLevel>("moderate");
  const [tripId, setTripId] = useState<number>(trips[0]?.id ?? 0);
  const [showTimeOffsets, setShowTimeOffsets] = useState(false);
  const [ackMessage, setAckMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTrip = trips.find((trip) => trip.id === tripId) ?? trips[0];

  async function submitArrival(observedAt: Date) {
    if (!selectedTrip?.scheduled_at) {
      throw new Error("Horário previsto indisponível para esta viagem.");
    }

    await postReportChegada({
      stop_id: stopId,
      trip_id: selectedTrip.id,
      scheduled_at: selectedTrip.scheduled_at,
      observed_at: observedAt.toISOString(),
      context,
    });
    onSuccess();
    onClose();
  }

  async function handleArrivalNow() {
    setSubmitting(true);
    setError(null);
    try {
      await submitArrival(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar relato.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleArrivalOffset(minutes: number) {
    setSubmitting(true);
    setError(null);
    try {
      const observedAt = new Date(Date.now() - minutes * 60 * 1000);
      await submitArrival(observedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar relato.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleArrivalNotYet() {
    setAckMessage("Registrado — obrigado!");
    window.setTimeout(() => onClose(), 1200);
  }

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
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar relato.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleTabChange(tabId: ReportType) {
    setReportType(tabId);
    setShowTimeOffsets(false);
    setError(null);
    setAckMessage(null);
  }

  const tripSelector =
    trips.length > 1 && reportType !== "safety" ? (
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-darktxt">Viagem</legend>
        <div className="flex flex-wrap gap-2">
          {trips.map((trip) => (
            <button
              key={trip.id}
              type="button"
              onClick={() => setTripId(trip.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                tripId === trip.id
                  ? "bg-teal text-paper"
                  : "bg-light text-muted hover:bg-tint"
              }`}
            >
              {trip.line_name} · {trip.headsign}
            </button>
          ))}
        </div>
      </fieldset>
    ) : null;

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
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                reportType === tab.id ? tabActiveClass(tab.id) : "bg-light text-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {reportType === "arrival" ? (
          <div className="space-y-4">
            {tripSelector}

            {selectedTrip?.scheduled_at && (
              <p className="rounded-lg bg-light px-3 py-2 text-sm text-muted">
                Horário previsto:{" "}
                {new Date(selectedTrip.scheduled_at).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}

            {trips.length === 0 && (
              <p className="text-sm text-muted">Nenhuma viagem disponível para esta parada.</p>
            )}

            {ackMessage ? (
              <p className="rounded-lg bg-light px-3 py-3 text-center text-sm font-medium text-darktxt">
                {ackMessage}
              </p>
            ) : (
              <>
                <div className="grid gap-2">
                  <button
                    type="button"
                    disabled={submitting || trips.length === 0}
                    onClick={() => void handleArrivalNow()}
                    className="rounded-lg bg-teal py-3 text-sm font-semibold text-paper transition hover:bg-teal/90 disabled:opacity-50"
                  >
                    {submitting ? "Enviando..." : "Passou agora"}
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleArrivalNotYet}
                    className="rounded-lg border border-tint bg-light py-3 text-sm font-medium text-darktxt transition hover:bg-tint disabled:opacity-50"
                  >
                    Não passou
                  </button>
                  <button
                    type="button"
                    disabled={submitting || trips.length === 0}
                    onClick={() => setShowTimeOffsets((current) => !current)}
                    className="rounded-lg border border-teal/30 bg-teal/10 py-3 text-sm font-medium text-teal transition hover:bg-teal/20 disabled:opacity-50"
                  >
                    Informar horário
                  </button>
                </div>

                {showTimeOffsets && (
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium text-darktxt">Quando passou?</legend>
                    <div className="grid grid-cols-3 gap-2">
                      {TIME_OFFSET_OPTIONS.map((opt) => (
                        <button
                          key={opt.minutes}
                          type="button"
                          disabled={submitting}
                          onClick={() => void handleArrivalOffset(opt.minutes)}
                          className="rounded-lg bg-light py-2 text-sm font-medium text-darktxt transition hover:bg-tint disabled:opacity-50"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}
              </>
            )}

            {error && <p className="text-sm text-muted">{error}</p>}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {tripSelector}

            {reportType === "safety" && (
              <>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-darktxt">Categoria</legend>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {CATEGORY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCategory(opt.value)}
                        className={`rounded-lg py-2 text-sm font-medium transition ${
                          category === opt.value
                            ? "bg-coral text-paper"
                            : "bg-light text-muted hover:bg-tint"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
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

            {error && <p className="text-sm text-muted">{error}</p>}

            <button
              type="submit"
              disabled={submitting || (reportType === "occupancy" && trips.length === 0)}
              className="w-full rounded-full bg-sea py-3 text-sm font-semibold text-paper transition hover:bg-sea/90 disabled:opacity-50"
            >
              {submitting ? "Enviando..." : "Enviar relato"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
