import type { Edge, Node } from "reactflow";

export type TraceStep = {
  step: number;
  line_number?: number | null;
  event_type?: string | null;
  variables?: Record<string, unknown> | null;
  call_stack?: string[] | null;
  return_value?: unknown;
};

export type FlowNodeData = {
  step: number;
  lineLabel: string;
  eventLabel: string;
  stackDepth: number;
  active: boolean;
  summary: string;
};

export type VariableEntry = {
  key: string;
  value: string;
  kind: "primitive" | "array" | "object";
};

const stringifyCompact = (value: unknown) => {
  try {
    const serialized = JSON.stringify(value);
    if (!serialized) {
      return String(value);
    }

    return serialized.length > 44 ? `${serialized.slice(0, 44)}...` : serialized;
  } catch {
    return String(value);
  }
};

const toKind = (value: unknown): VariableEntry["kind"] => {
  if (Array.isArray(value)) {
    return "array";
  }

  if (value && typeof value === "object") {
    return "object";
  }

  return "primitive";
};

export const normalizeVariableEntries = (
  variables: Record<string, unknown> | null | undefined
): VariableEntry[] => {
  if (!variables) {
    return [];
  }

  return Object.entries(variables).map(([key, value]) => ({
    key,
    value: stringifyCompact(value),
    kind: toKind(value),
  }));
};

const buildSummary = (step: TraceStep) => {
  if (step.event_type === "return") {
    return step.return_value == null
      ? "Returns control"
      : `Returns ${stringifyCompact(step.return_value)}`;
  }

  const entries = normalizeVariableEntries(step.variables);
  if (entries.length === 0) {
    return "No variable snapshot";
  }

  return entries
    .slice(0, 2)
    .map((entry) => `${entry.key}: ${entry.value}`)
    .join(" • ");
};

export const buildExecutionFlow = (
  traceSteps: TraceStep[],
  activeIndex: number
): {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
} => {
  const nodes: Node<FlowNodeData>[] = traceSteps.map((step, index) => {
    const stackDepth = step.call_stack?.length ?? 0;
    const lineLabel =
      typeof step.line_number === "number" ? `Line ${step.line_number}` : "No line";
    const eventLabel = step.event_type ? step.event_type.toUpperCase() : "STEP";
    const isActive = index === activeIndex;
    const borderColor =
      eventLabel === "CALL"
        ? "rgba(56, 189, 248, 0.75)"
        : eventLabel === "RETURN"
        ? "rgba(52, 211, 153, 0.75)"
        : "rgba(99, 102, 241, 0.55)";
    const shadowColor =
      eventLabel === "CALL"
        ? "rgba(14, 165, 233, 0.25)"
        : eventLabel === "RETURN"
        ? "rgba(16, 185, 129, 0.22)"
        : "rgba(99, 102, 241, 0.2)";

    return {
      id: `trace-${index}`,
      position: {
        x: index * 300,
        y: stackDepth * 110,
      },
      type: "trace",
      draggable: false,
      selectable: false,
      style: {
        width: 240,
        borderRadius: 18,
        border: `1px solid ${borderColor}`,
        background: isActive
          ? "linear-gradient(180deg, rgba(79,70,229,0.28), rgba(15,23,42,0.95))"
          : "linear-gradient(180deg, rgba(15,23,42,0.95), rgba(2,6,23,0.95))",
        color: "#e2e8f0",
        boxShadow: isActive
          ? `0 18px 40px ${shadowColor}`
          : `0 10px 24px ${shadowColor}`,
        padding: 0,
      },
      data: {
        step: step.step,
        lineLabel,
        eventLabel,
        stackDepth,
        active: isActive,
        summary: buildSummary(step),
      },
    };
  });

  const edges: Edge[] = traceSteps.slice(1).map((step, index) => {
    const previous = traceSteps[index];
    const currentDepth = step.call_stack?.length ?? 0;
    const previousDepth = previous.call_stack?.length ?? 0;
    const isCallTransition = currentDepth > previousDepth;
    const isReturnTransition = currentDepth < previousDepth || step.event_type === "return";

    return {
      id: `edge-${index}-${index + 1}`,
      source: `trace-${index}`,
      target: `trace-${index + 1}`,
      animated: index === activeIndex - 1,
      type: "smoothstep",
      label: isCallTransition ? "call" : isReturnTransition ? "return" : undefined,
      style: {
        stroke: isCallTransition
          ? "#38bdf8"
          : isReturnTransition
          ? "#34d399"
          : "#6366f1",
        strokeWidth: index === activeIndex - 1 ? 2.5 : 1.6,
      },
      labelStyle: {
        fill: "#cbd5e1",
        fontSize: 11,
      },
    };
  });

  return { nodes, edges };
};
