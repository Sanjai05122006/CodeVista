export type TimeComplexity = {
  best: string;
  average: string;
  worst: string;
};

export type AnalysisResponse = {
  pseudocode: string[];
  algorithm_steps: string[];
  time_complexity: TimeComplexity;
  space_complexity: string;
};

export type AnalysisSource = "cache" | "gemini" | "groq";

export type AnalysisResult = AnalysisResponse & {
  source: AnalysisSource;
};
