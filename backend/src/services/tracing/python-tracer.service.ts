import { executeJudge0 } from "../../integrations/judge0";
import { executePiston } from "../../integrations/piston";
import { logger } from "../../utils/logger";
import { TraceStep } from "../../types/analysis";

const TRACE_START = "__CODEVISTA_TRACE_START__";
const TRACE_END = "__CODEVISTA_TRACE_END__";
const MAX_TRACE_STEPS = 300;

const buildPythonWrapper = (code: string, stdin: string) => {
  return `
import io
import json
import sys
import traceback
from contextlib import redirect_stdout, redirect_stderr

USER_CODE = ${JSON.stringify(code)}
STDIN_DATA = ${JSON.stringify(stdin)}
MAX_TRACE_STEPS = ${MAX_TRACE_STEPS}
trace = []
call_stack = []

def sanitize(value, depth=0, seen=None):
    if seen is None:
        seen = set()

    if value is None or isinstance(value, (bool, int, float)):
        return value

    if isinstance(value, str):
        return value[:200] + ("..." if len(value) > 200 else "")

    if isinstance(value, (bytes, bytearray)):
        text = value[:120].decode("utf-8", errors="replace")
        return text + ("..." if len(value) > 120 else "")

    if callable(value):
        return "[Function]"

    value_id = id(value)
    if value_id in seen:
        return "[Circular]"

    if depth >= 2:
        if isinstance(value, list):
            return f"[List({len(value)})]"
        if isinstance(value, tuple):
            return f"[Tuple({len(value)})]"
        if isinstance(value, dict):
            return "[Dict]"
        return f"[{type(value).__name__}]"

    seen.add(value_id)

    if isinstance(value, list):
        return [sanitize(item, depth + 1, seen) for item in value[:20]]

    if isinstance(value, tuple):
        return [sanitize(item, depth + 1, seen) for item in value[:20]]

    if isinstance(value, dict):
        normalized = {}
        for key in list(value.keys())[:20]:
            normalized[str(key)] = sanitize(value[key], depth + 1, seen)
        return normalized

    if hasattr(value, "__dict__"):
        normalized = {}
        for key, item in list(vars(value).items())[:20]:
            normalized[str(key)] = sanitize(item, depth + 1, seen)
        return normalized

    return str(value)

def append_step(line_number, event_type, variables=None, return_value=None):
    if len(trace) >= MAX_TRACE_STEPS:
        return

    trace.append({
        "step": len(trace) + 1,
        "line_number": line_number,
        "event_type": event_type,
        "variables": variables,
        "call_stack": list(call_stack),
        "return_value": return_value,
    })

def tracer(frame, event, arg):
    if frame.f_code.co_filename != "codevista_user.py":
        return tracer

    if event == "call":
        call_stack.append(frame.f_code.co_name or "<module>")
        append_step(frame.f_lineno, "call", {})
        return tracer

    if event == "line":
        variables = {}
        for key, value in frame.f_locals.items():
            if key == "__builtins__":
                continue
            variables[str(key)] = sanitize(value)
        append_step(frame.f_lineno, "statement", variables)
        return tracer

    if event == "return":
        append_step(frame.f_lineno, "return", None, sanitize(arg))
        if call_stack:
            call_stack.pop()
        return tracer

    return tracer

sys.stdin = io.StringIO(STDIN_DATA)
captured_stdout = io.StringIO()
captured_stderr = io.StringIO()
execution_error = None
globals_dict = {"__name__": "__main__"}
compiled = compile(USER_CODE, "codevista_user.py", "exec")

sys.settrace(tracer)
try:
    with redirect_stdout(captured_stdout), redirect_stderr(captured_stderr):
        exec(compiled, globals_dict, globals_dict)
except Exception:
    execution_error = traceback.format_exc()
finally:
    sys.settrace(None)
    append_step(None, "complete", {})

payload = {
    "trace": trace,
    "stdout": captured_stdout.getvalue(),
    "stderr": captured_stderr.getvalue(),
    "error": execution_error,
}

print("${TRACE_START}")
print(json.dumps(payload))
print("${TRACE_END}")
`;
};

const extractPayload = (stdout: string) => {
  const startIndex = stdout.indexOf(TRACE_START);
  const endIndex = stdout.indexOf(TRACE_END);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return null;
  }

  const jsonPayload = stdout
    .slice(startIndex + TRACE_START.length, endIndex)
    .trim();

  try {
    return JSON.parse(jsonPayload) as {
      trace?: TraceStep[];
      stdout?: string;
      stderr?: string;
      error?: string | null;
    };
  } catch {
    return null;
  }
};

const runTracingWrapper = async (wrappedCode: string) => {
  try {
    return await executeJudge0(wrappedCode, "python");
  } catch (judge0Error) {
    logger.warn("python.trace.judge0_failed", {
      message:
        judge0Error instanceof Error ? judge0Error.message : "Unknown Judge0 trace failure",
    });
    return executePiston(wrappedCode, "python");
  }
};

export const tracePythonExecution = async (
  code: string,
  stdin: string = ""
): Promise<TraceStep[]> => {
  try {
    const wrappedCode = buildPythonWrapper(code, stdin);
    const result = await runTracingWrapper(wrappedCode);
    const stdout = typeof result?.stdout === "string" ? result.stdout : result?.run?.stdout || "";
    const payload = extractPayload(stdout);

    if (!payload || !Array.isArray(payload.trace)) {
      return [];
    }

    return payload.trace;
  } catch (error) {
    logger.warn("python.trace.failed", {
      message: error instanceof Error ? error.message : "Unknown Python trace failure",
    });
    return [];
  }
};
