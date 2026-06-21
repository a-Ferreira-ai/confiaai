import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import FaixaConfianca from "../components/FaixaConfianca";
import { fetchRoute } from "../lib/api";
import type { RouteDetailResponse, RouteLeg, TransportMode } from "../lib/types";

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function legTitle(leg: RouteLeg): string {
  if (leg.leg_type === "transfer") {
    return "Baldeação";
  }
  return `${leg.line_name} · ${leg.mode_label}`;
}

export default function Rota() {
  const [searchParams] = useSearchParams();
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const routeIndex = Number(searchParams.get("route_index") ?? "0");
  const modeFilter = (searchParams.get("mode_filter") ?? "") as TransportMode | "";

  const [route, setRoute] = useState<RouteDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!origin || !destination) {
      setError("Parâmetros de rota inválidos.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    fetchRoute({
      originStopId: origin,
      destinationStopId: destination,
      modeFilter,
      routeIndex,
    })
      .then((data) => {
        if (!cancelled) setRoute(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [origin, destination, modeFilter, routeIndex]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light text-muted">
        Carregando rota...
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-coral">{error ?? "Rota não encontrada."}</p>
        <Link to="/busca" className="text-teal underline">
          Voltar à busca
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light">
      <header className="bg-ink px-6 py-8 text-paper">
        <Link to="/busca" className="mb-4 inline-block text-sm text-[#9FC6CC] underline">
          ← Nova busca
        </Link>
        <p className="text-sm uppercase tracking-widest text-[#7FA9AF]">Hora de sair</p>
        <h1 className="text-3xl font-bold">Saia às {formatTime(route.leave_at)}</h1>
        <p className="mt-2 text-[#9FC6CC]">
          Chegada prevista às {formatTime(route.arrive_at)} · {route.total_minutes} min
        </p>
        <div className="mt-6 rounded-xl bg-sea/20 p-4">
          <p className="text-sm font-medium text-[#06343A]">Confiança do trajeto</p>
          <p className="text-lg font-semibold text-[#06343A]">{route.reliability.label}</p>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-4 px-4 py-6">
        {route.legs.map((leg, index) => (
          <section
            key={`${leg.line_id ?? "transfer"}-${leg.from_stop.id}-${index}`}
            className="rounded-xl border border-tint bg-paper p-4 shadow-sm"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">
                  Etapa {index + 1} · {leg.mode_label}
                </p>
                <h2 className="font-semibold text-darktxt">{legTitle(leg)}</h2>
              </div>
              <span className="rounded-full bg-light px-2.5 py-0.5 text-xs font-medium text-muted">
                {leg.duration_minutes} min
              </span>
            </div>

            <div className="space-y-1 text-sm text-darktxt">
              <p>
                <Link to={`/parada/${leg.from_stop.id}`} className="text-teal underline">
                  {leg.from_stop.name}
                </Link>
                {" → "}
                <Link to={`/parada/${leg.to_stop.id}`} className="text-teal underline">
                  {leg.to_stop.name}
                </Link>
              </p>
              <p className="text-muted">
                {formatTime(leg.depart_at)} → {formatTime(leg.arrive_at)}
              </p>
            </div>

            {leg.reliability && leg.mode === "bus" && (
              <div className="mt-4 border-t border-tint pt-4">
                <FaixaConfianca reliability={leg.reliability} compact />
                {leg.line_id && (
                  <Link
                    to={`/linha/${leg.line_id}`}
                    className="mt-2 inline-block text-xs text-teal underline"
                  >
                    Ver linha
                  </Link>
                )}
              </div>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
