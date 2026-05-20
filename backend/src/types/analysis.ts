export type TimeComplexity = {
  best: string;
  average: string;
  worst: string;
};

export type TraceEventType =
  | "assignment"
  | "call"
  | "return"
  | "loop_iteration"
  | "branch"
  | "complete";

export type TraceStep = {
  step: number;
  line_number: number | null;
  event_type: TraceEventType | null;
  variables: Record<string, unknown> | null;
  call_stack: string[] | null;
  return_value?: unknown;
};

export type AnalysisResponse = {
  pseudocode: string[];
  algorithm_name: string;
  algorithm_steps: string[];
  time_complexity: TimeComplexity;
  space_complexity: string;
  explanation: string;
  execution_trace: TraceStep[];
};

export type AnalysisSource = "cache" | "gemini" | "groq";

export type AnalysisResult = AnalysisResponse & {
  source: AnalysisSource;
};
