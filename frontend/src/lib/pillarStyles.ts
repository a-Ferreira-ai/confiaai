import type { Reliability, ReliabilityLevel } from "./types";

/** Semáforo verde/amarelo/vermelho para níveis de confiança (dentro do pilar teal). */
export const RELIABILITY_SEMAPHORE: Record<ReliabilityLevel, string> = {
  high: "#22C55E",
  medium: "#EAB308",
  low: "#EF4444",
};

export const RELIABILITY_NO_DATA_COLOR = "#5B7079";

export const MAP_ORIGIN_COLOR = "#12849A";
export const MAP_DESTINATION_COLOR = "#2A9D8F";

export function reliabilityPinColor(reliability: Reliability): string {
  if (reliability.sample_size === 0) {
    return RELIABILITY_NO_DATA_COLOR;
  }
  return RELIABILITY_SEMAPHORE[reliability.level];
}

export function reliabilitySemaphoreClass(level: ReliabilityLevel): string {
  switch (level) {
    case "high":
      return "bg-[#22C55E]";
    case "medium":
      return "bg-[#EAB308]";
    case "low":
      return "bg-[#EF4444]";
  }
}

export function reliabilityFillPercent(level: ReliabilityLevel): number {
  switch (level) {
    case "high":
      return 100;
    case "medium":
      return 66;
    case "low":
      return 33;
  }
}

export function reliabilityDisplayLabel(reliability: Reliability): string {
  if (reliability.sample_size === 0) {
    return "confiança em construção";
  }
  return reliability.label;
}
