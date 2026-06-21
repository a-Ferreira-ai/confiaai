import { useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import Busca from "./pages/Busca";
import Linha from "./pages/Linha";
import MapaDemanda from "./pages/MapaDemanda";
import Parada from "./pages/Parada";
import Ranking from "./pages/Ranking";
import Rota from "./pages/Rota";
import { fetchLines } from "./lib/api";

function Home() {
  const [firstLineId, setFirstLineId] = useState<number | null>(null);

  useEffect(() => {
    fetchLines()
      .then((data) => {
        if (data.lines.length > 0) setFirstLineId(data.lines[0].id);
      })
      .catch(() => {
        setFirstLineId(1);
      });
  }, []);

  return (
    <div className="min-h-screen bg-ink text-paper">
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
        <p className="mb-2 text-sm uppercase tracking-widest text-[#7FA9AF]">
          ônibus &amp; metrô
        </p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight">Confia.</h1>
        <p className="mb-8 text-[#9FC6CC]">
          Transporte público do DF com confiança, no corredor Ceilândia ↔
          Taguatinga.
        </p>
        {firstLineId !== null && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/busca"
                className="rounded-full bg-sea px-6 py-3 text-sm font-semibold text-paper transition hover:bg-sea/90"
              >
                Planejar viagem
              </Link>
              <Link
                to={`/linha/${firstLineId}`}
                className="rounded-full bg-teal px-6 py-3 text-sm font-semibold text-paper transition hover:bg-teal/90"
              >
                Ver confiança da linha
              </Link>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/demanda"
                className="rounded-full border border-[#7FA9AF] px-6 py-3 text-sm font-semibold text-[#9FC6CC] transition hover:bg-ink2"
              >
                Mapa de demanda
              </Link>
              <Link
                to="/ranking"
                className="rounded-full border border-[#7FA9AF] px-6 py-3 text-sm font-semibold text-[#9FC6CC] transition hover:bg-ink2"
              >
                Ranking de linhas
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/busca" element={<Busca />} />
        <Route path="/rota" element={<Rota />} />
        <Route path="/linha/:id" element={<Linha />} />
        <Route path="/parada/:id" element={<Parada />} />
        <Route path="/demanda" element={<MapaDemanda />} />
        <Route path="/ranking" element={<Ranking />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
