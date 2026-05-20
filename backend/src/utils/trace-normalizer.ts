import { TraceEventType } from "../types/analysis";

const TRACE_EVENT_TYPES: TraceEventType[] = [
  "assignment",
  "call",
  "return",
  "loop_iteration",
  "branch",
  "complete",
];

export const normalizeTraceEventType = (
  value: unknown
): TraceEventType | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (TRACE_EVENT_TYPES.includes(normalized as TraceEventType)) {
    return normalized as TraceEventType;
  }

  if (
    normalized === "declaration" ||
    normalized === "expression" ||
    normalized === "statement"
  ) {
    return "assignment";
  }

  if (normalized === "loop") {
    return "loop_iteration";
  }

  return null;
};
