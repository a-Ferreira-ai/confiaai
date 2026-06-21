import type { GeofenceStop } from "../lib/geofence";

interface PromptGeofenceProps {
  stop: GeofenceStop;
  onReport: () => void;
  onDismiss: () => void;
}

export default function PromptGeofence({ stop, onReport, onDismiss }: PromptGeofenceProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-6">
      <div className="mx-auto max-w-lg rounded-2xl border border-tint bg-paper p-4 shadow-lg">
        <p className="text-xs uppercase tracking-wide text-teal">Você está perto</p>
        <h3 className="mt-1 text-lg font-semibold text-darktxt">Chegou em {stop.name}?</h3>
        <p className="mt-1 text-sm text-muted">
          Ajude outros passageiros reportando ocupação, segurança ou horário de chegada.
        </p>
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
            onClick={onReport}
            className="flex-1 rounded-full bg-teal py-2.5 text-sm font-semibold text-paper transition hover:bg-teal/90"
          >
            Reportar
          </button>
        </div>
      </div>
    </div>
  );
}
