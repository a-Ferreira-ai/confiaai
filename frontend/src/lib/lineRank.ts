import type { RankingLine } from "./types";

export function findLineRank(lines: RankingLine[], lineId: number): RankingLine | null {
  return lines.find((line) => line.id === lineId) ?? null;
}

export function formatRankLabel(rank: number): string {
  return `${rank}º lugar em pontualidade no corredor`;
}

export function rankBadgeText(entry: RankingLine | null): string | null {
  if (!entry) return null;
  if (entry.reliability.sample_size === 0) {
    return "Confiança em construção no corredor";
  }
  return formatRankLabel(entry.rank);
}
