import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import ChatWidget from "./components/Chat/ChatWidget";
import Busca from "./pages/Busca";
import Favoritos from "./pages/Favoritos";
import Linha from "./pages/Linha";
import MapaDemanda from "./pages/MapaDemanda";
import Parada from "./pages/Parada";
import Ranking from "./pages/Ranking";
import Rota from "./pages/Rota";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Busca />} />
          <Route path="/demanda" element={<MapaDemanda />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/favoritos" element={<Favoritos />} />
        </Route>
        <Route path="/rota" element={<Rota />} />
        <Route path="/linha/:id" element={<Linha />} />
        <Route path="/parada/:id" element={<Parada />} />
      </Routes>
      <ChatWidget />
    </BrowserRouter>
  );
}

export default App;
