import assert from "node:assert/strict";
import { traceJavascriptExecution } from "./javascript-tracer.service";

const run = () => {
  const trace = traceJavascriptExecution(`
function classify(n) {
  if (n > 0) {
    return n;
  }
  return 0;
}

let total = 0;
for (let i = 0; i < 2; i += 1) {
  total += classify(i);
}
`);

  assert.ok(trace.length > 0);
  assert.ok(trace.some((step) => step.event_type === "call"));
  assert.ok(trace.some((step) => step.event_type === "return"));
  assert.ok(trace.some((step) => step.event_type === "branch"));
  assert.ok(trace.some((step) => step.event_type === "loop_iteration"));
  assert.ok(trace.some((step) => step.event_type === "assignment"));
  assert.equal(trace[trace.length - 1]?.event_type, "complete");

  console.log("tracing.service tests passed");
};

run();
