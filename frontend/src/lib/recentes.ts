import type { TransportMode } from "./types";

const STORAGE_KEY = "confia_buscas_recentes";
const MAX_RECENT = 5;

export interface RecentSearch {
  originId: number;
  originName: string;
  destinationId: number;
  destinationName: string;
  modeFilter: TransportMode | "";
  searchedAt: number;
}

function readAll(): RecentSearch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentSearch[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: RecentSearch[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getRecentes(): RecentSearch[] {
  return readAll();
}

export function addRecente(entry: Omit<RecentSearch, "searchedAt">): void {
  const items = readAll().filter(
    (item) =>
      !(
        item.originId === entry.originId &&
        item.destinationId === entry.destinationId &&
        item.modeFilter === entry.modeFilter
      ),
  );

  writeAll([{ ...entry, searchedAt: Date.now() }, ...items].slice(0, MAX_RECENT));
}
