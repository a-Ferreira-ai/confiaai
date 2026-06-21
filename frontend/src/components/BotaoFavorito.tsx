import { useState } from "react";
import { isFavorito, toggleFavorito, type FavoriteItem } from "../lib/favoritos";

interface BotaoFavoritoProps {
  item: FavoriteItem;
  className?: string;
}

export default function BotaoFavorito({ item, className = "" }: BotaoFavoritoProps) {
  const [favorited, setFavorited] = useState(() => isFavorito(item.kind, item.id));

  function handleClick() {
    const next = toggleFavorito(item);
    setFavorited(next);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={favorited}
      className={`rounded-full p-2 transition hover:bg-paper/10 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-6 w-6 ${favorited ? "fill-teal text-teal" : "fill-none text-paper/70"}`}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
