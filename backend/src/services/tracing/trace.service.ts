import { TraceStep } from "../../types/analysis";
import { buildFallbackTrace } from "./fallback-tracer.service";
import { traceJavascriptExecution } from "./javascript-tracer.service";
import { tracePythonExecution } from "./python-tracer.service";

export const generateExecutionTrace = async (
  code: string,
  language: string,
  stdin: string = ""
): Promise<TraceStep[]> => {
  if (language === "javascript") {
    return traceJavascriptExecution(code);
  }

  if (language === "python") {
    const pythonTrace = await tracePythonExecution(code, stdin);
    return pythonTrace.length > 0 ? pythonTrace : buildFallbackTrace(code);
  }

  return buildFallbackTrace(code);
};
