import { AnalysisResponse, TimeComplexity } from "../types/analysis";

type CoreAnalysis = Pick<
  AnalysisResponse,
  "pseudocode" | "algorithm_steps" | "time_complexity" | "space_complexity"
>;

export const extractArray = (obj: any, key: string): string[] => {
  if (!Array.isArray(obj?.[key])) {
    return [];
  }

  return obj[key].filter((item: unknown) => typeof item === "string");
};

export const normalizeTimeComplexity = (value: unknown): TimeComplexity => {
  if (typeof value === "string") {
    return {
      best: value,
      average: value,
      worst: value,
    };
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const source = value as Record<string, unknown>;
    return {
      best: typeof source.best === "string" ? source.best : "O(?)",
      average: typeof source.average === "string" ? source.average : "O(?)",
      worst: typeof source.worst === "string" ? source.worst : "O(?)",
    };
  }

  return {
    best: "O(?)",
    average: "O(?)",
    worst: "O(?)",
  };
};

export const normalizeSpaceComplexity = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  return "O(?)";
};

const normalizePseudocode = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((v) => typeof v === "string");
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeAlgorithmSteps = (raw: any): string[] => {
  const candidate =
    raw?.algorithm_steps ?? raw?.pseudo_algorithm ?? raw?.algorithm;

  if (Array.isArray(candidate)) {
    return candidate.filter((value) => typeof value === "string");
  }

  if (typeof candidate === "string") {
    return candidate
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [];
};

export const normalizeAnalysis = (raw: any): CoreAnalysis => {
  return {
    pseudocode: normalizePseudocode(raw?.pseudocode),
    algorithm_steps: normalizeAlgorithmSteps(raw),
    time_complexity: normalizeTimeComplexity(raw?.time_complexity),
    space_complexity: normalizeSpaceComplexity(raw?.space_complexity),
  };
};

export const safeParse = (text: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const match = cleaned.match(/\{[\s\S]*\}/);

    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};
