import { env } from "../config/env";

export type ProductLanguage = {
  id: number;
  key: "javascript" | "python" | "cpp";
  name: string;
  execution_enabled: true;
  analysis_enabled: true;
  trace_mode: "full" | "fallback" | "none";
  trace_description: string;
};

export const fetchLanguages = async (): Promise<ProductLanguage[]> => {
  const javascriptTraceMode = env.ALLOW_UNSAFE_JS_TRACING ? "full" : "none";

  return [
    {
      id: 63,
      key: "javascript",
      name: "JavaScript",
      execution_enabled: true,
      analysis_enabled: true,
      trace_mode: javascriptTraceMode,
      trace_description:
        javascriptTraceMode === "full"
          ? "JavaScript tracing is fully enabled in this environment."
          : "JavaScript execution and analysis are available, but trace playback is disabled in this environment.",
    },
    {
      id: 71,
      key: "python",
      name: "Python",
      execution_enabled: true,
      analysis_enabled: true,
      trace_mode: "full",
      trace_description:
        "Python supports execution, analysis, and step-by-step trace playback.",
    },
    {
      id: 54,
      key: "cpp",
      name: "C++",
      execution_enabled: true,
      analysis_enabled: true,
      trace_mode: "fallback",
      trace_description:
        "C++ supports execution and analysis, but trace playback currently uses a fallback view and is not equivalent to Python tracing.",
    },
  ];
};
