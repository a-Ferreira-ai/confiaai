import type { TransportMode } from "./types";

const STORAGE_KEY = "confia_favoritos";

export type FavoriteKind = "stop" | "line";

export interface FavoriteItem {
  kind: FavoriteKind;
  id: number;
  name: string;
  mode?: TransportMode;
  mode_label?: string;
}

function readAll(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FavoriteItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: FavoriteItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getFavoritos(): FavoriteItem[] {
  return readAll();
}

export function isFavorito(kind: FavoriteKind, id: number): boolean {
  return readAll().some((item) => item.kind === kind && item.id === id);
}

export function addFavorito(item: FavoriteItem): void {
  const items = readAll();
  if (items.some((existing) => existing.kind === item.kind && existing.id === item.id)) {
    return;
  }
  writeAll([...items, item]);
}

export function removeFavorito(kind: FavoriteKind, id: number): void {
  writeAll(readAll().filter((item) => !(item.kind === kind && item.id === id)));
}

export function toggleFavorito(item: FavoriteItem): boolean {
  if (isFavorito(item.kind, item.id)) {
    removeFavorito(item.kind, item.id);
    return false;
  }
  addFavorito(item);
  return true;
}
