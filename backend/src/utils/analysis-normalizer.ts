import { AnalysisResponse, TimeComplexity, TraceStep } from "../types/analysis";

type CoreAnalysis = Pick<
  AnalysisResponse,
  | "pseudocode"
  | "algorithm_steps"
  | "time_complexity"
  | "space_complexity"
  | "execution_trace"
>;

const normalizeTrace = (value: unknown): TraceStep[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item, index) => ({
      step:
        typeof item.step === "number" && Number.isFinite(item.step)
          ? item.step
          : index + 1,
      line_number:
        typeof item.line_number === "number" && Number.isFinite(item.line_number)
          ? item.line_number
          : null,
      event_type: typeof item.event_type === "string" ? item.event_type : null,
      variables:
        item.variables && typeof item.variables === "object" && !Array.isArray(item.variables)
          ? (item.variables as Record<string, unknown>)
          : null,
      call_stack: Array.isArray(item.call_stack)
        ? item.call_stack.filter((entry): entry is string => typeof entry === "string")
        : null,
      return_value: "return_value" in item ? item.return_value : null,
    }));
};

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
    execution_trace: normalizeTrace(raw?.execution_trace),
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
