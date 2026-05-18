import { TraceStep } from "../../types/analysis";

const classifyEventType = (line: string) => {
  const trimmed = line.trim();

  if (
    trimmed.startsWith("if ") ||
    trimmed.startsWith("if(") ||
    trimmed.startsWith("else") ||
    trimmed.startsWith("switch") ||
    trimmed.startsWith("case ")
  ) {
    return "branch";
  }

  if (
    trimmed.startsWith("for ") ||
    trimmed.startsWith("for(") ||
    trimmed.startsWith("while ") ||
    trimmed.startsWith("while(") ||
    trimmed.startsWith("do ")
  ) {
    return "loop";
  }

  if (trimmed.startsWith("return")) {
    return "return";
  }

  return "statement";
};

const isTraceableLine = (line: string) => {
  const trimmed = line.trim();

  if (!trimmed) {
    return false;
  }

  if (
    trimmed === "{" ||
    trimmed === "}" ||
    trimmed === "};" ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("#")
  ) {
    return false;
  }

  return true;
};

export const buildFallbackTrace = (code: string): TraceStep[] => {
  const steps: TraceStep[] = [];
  const lines = code.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!isTraceableLine(line)) {
      continue;
    }

    steps.push({
      step: steps.length + 1,
      line_number: index + 1,
      event_type: classifyEventType(line),
      variables: null,
      call_stack: null,
    });
  }

  if (steps.length > 0) {
    steps.push({
      step: steps.length + 1,
      line_number: null,
      event_type: "complete",
      variables: {},
      call_stack: [],
    });
  }

  return steps;
};
