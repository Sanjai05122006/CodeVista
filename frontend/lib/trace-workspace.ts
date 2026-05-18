import type { TraceStep } from "@/lib/trace-visualizer";

const TRACE_WORKSPACE_STORAGE_KEY = "codevista-trace-workspace";
const TRACE_WORKSPACE_EVENT = "codevista-trace-workspace-change";

export type TraceWorkspaceSnapshot = {
  title: string;
  language: string;
  code: string;
  traceSteps: TraceStep[];
  runtimeMs: number | null;
  memoryKb: number | null;
  sessionId: string | null;
  capturedAt: string;
};

let cachedRawSnapshot: string | null | undefined;
let cachedParsedSnapshot: TraceWorkspaceSnapshot | null = null;

const normalizeTraceSteps = (trace: unknown): TraceStep[] => {
  if (!Array.isArray(trace)) {
    return [];
  }

  return trace
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

export const saveTraceWorkspaceSnapshot = (snapshot: TraceWorkspaceSnapshot) => {
  if (typeof window === "undefined") {
    return;
  }

  const serialized = JSON.stringify(snapshot);
  window.sessionStorage.setItem(TRACE_WORKSPACE_STORAGE_KEY, serialized);
  cachedRawSnapshot = serialized;
  cachedParsedSnapshot = snapshot;
  window.dispatchEvent(new Event(TRACE_WORKSPACE_EVENT));
};

export const readTraceWorkspaceSnapshot = (): TraceWorkspaceSnapshot | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(TRACE_WORKSPACE_STORAGE_KEY);
  if (!raw) {
    cachedRawSnapshot = null;
    cachedParsedSnapshot = null;
    return null;
  }

  if (raw === cachedRawSnapshot) {
    return cachedParsedSnapshot;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<TraceWorkspaceSnapshot>;

    if (!parsed || typeof parsed !== "object") {
      cachedRawSnapshot = raw;
      cachedParsedSnapshot = null;
      return null;
    }

    const snapshot = {
      title: typeof parsed.title === "string" ? parsed.title : "Execution Insights",
      language: typeof parsed.language === "string" ? parsed.language : "javascript",
      code: typeof parsed.code === "string" ? parsed.code : "",
      traceSteps: normalizeTraceSteps(parsed.traceSteps),
      runtimeMs:
        typeof parsed.runtimeMs === "number" && Number.isFinite(parsed.runtimeMs)
          ? parsed.runtimeMs
          : null,
      memoryKb:
        typeof parsed.memoryKb === "number" && Number.isFinite(parsed.memoryKb)
          ? parsed.memoryKb
          : null,
      sessionId: typeof parsed.sessionId === "string" ? parsed.sessionId : null,
      capturedAt:
        typeof parsed.capturedAt === "string" ? parsed.capturedAt : new Date().toISOString(),
    };

    cachedRawSnapshot = raw;
    cachedParsedSnapshot = snapshot;
    return snapshot;
  } catch {
    cachedRawSnapshot = raw;
    cachedParsedSnapshot = null;
    return null;
  }
};

export const subscribeToTraceWorkspace = (onStoreChange: () => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key && event.key !== TRACE_WORKSPACE_STORAGE_KEY) {
      return;
    }

    onStoreChange();
  };

  const handleWorkspaceChange = () => {
    onStoreChange();
  };

  window.addEventListener("storage", handleStorageChange);
  window.addEventListener(TRACE_WORKSPACE_EVENT, handleWorkspaceChange);

  return () => {
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener(TRACE_WORKSPACE_EVENT, handleWorkspaceChange);
  };
};
