import type { ReportType } from "./FluxoReporte";
import type { GeofencePromptKind, GeofenceStop } from "../lib/geofence";

interface PromptGeofenceProps {
  kind: GeofencePromptKind;
  stop: GeofenceStop;
  lineName?: string;
  onReport: (initialType: ReportType) => void;
  onDismiss: () => void;
}

function promptCopy(kind: GeofencePromptKind, stop: GeofenceStop, lineName?: string) {
  if (kind === "boarding") {
    return {
      eyebrow: "Embarque",
      title: "Como está a ocupação agora?",
      description: `Você está em ${stop.name}. Ajude outros passageiros com um relato rápido.`,
    };
  }

  if (kind === "dwell") {
    return {
      eyebrow: "Permanência",
      title: "Tudo bem por aqui?",
      description: "Reporte segurança se algo não estiver ok — leva só um toque.",
    };
  }

  return {
    eyebrow: "Você está perto",
    title: lineName ? `O ônibus ${lineName} já passou?` : `Chegou em ${stop.name}?`,
    description: "Ajude outros passageiros reportando horário, ocupação ou segurança.",
  };
}

function reportTypeForKind(kind: GeofencePromptKind): ReportType {
  if (kind === "boarding") return "occupancy";
  if (kind === "dwell") return "safety";
  return "arrival";
}

export default function PromptGeofence({
  kind,
  stop,
  lineName,
  onReport,
  onDismiss,
}: PromptGeofenceProps) {
  const copy = promptCopy(kind, stop, lineName);
  const initialType = reportTypeForKind(kind);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-6">
      <div className="mx-auto max-w-lg rounded-2xl border border-tint bg-paper p-4 shadow-lg">
        <p className="text-xs uppercase tracking-wide text-teal">{copy.eyebrow}</p>
        <h3 className="mt-1 text-lg font-semibold text-darktxt">{copy.title}</h3>
        <p className="mt-1 text-sm text-muted">{copy.description}</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 rounded-full border border-tint py-2.5 text-sm font-medium text-muted transition hover:bg-light"
          >
            Agora não
          </button>
          <button
            type="button"
            onClick={() => onReport(initialType)}
            className="flex-1 rounded-full bg-teal py-2.5 text-sm font-semibold text-paper transition hover:bg-teal/90"
          >
            Reportar
          </button>
        </div>
      </div>
    </div>
  );
}
