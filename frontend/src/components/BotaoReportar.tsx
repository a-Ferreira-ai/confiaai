import { useState } from "react";
import FluxoReporte, { type ReportType } from "./FluxoReporte";
import type { ReportContext, StopTripRef } from "../lib/types";

interface BotaoReportarProps {
  stopId: number;
  stopName: string;
  trips: StopTripRef[];
  context?: ReportContext;
  initialType?: ReportType;
  onSuccess: () => void;
}

export default function BotaoReportar({
  stopId,
  stopName,
  trips,
  context = "on_demand",
  initialType,
  onSuccess,
}: BotaoReportarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-coral text-2xl font-bold text-paper shadow-lg transition hover:bg-coral/90"
        aria-label="Reportar"
      >
        +
      </button>

      {open && (
        <FluxoReporte
          stopId={stopId}
          stopName={stopName}
          trips={trips}
          context={context}
          initialType={initialType}
          onSuccess={onSuccess}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
