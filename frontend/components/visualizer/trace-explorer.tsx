"use client";

import { ExecutionFlow } from "./execution-flow";
import type { TraceStep } from "@/lib/trace-visualizer";

type TraceExplorerProps = {
  traceSteps: TraceStep[];
  traceIndex: number;
  isTracePlaying: boolean;
  onBack: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
};

export function TraceExplorer({
  traceSteps,
  traceIndex,
  isTracePlaying,
  onBack,
  onNext,
  onTogglePlay,
}: TraceExplorerProps) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-white/10 bg-[#111827] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm text-gray-200">Execution Insights</h3>
          <p className="text-[11px] text-gray-500">
            {traceSteps.length > 0
              ? `Step ${traceIndex + 1} of ${traceSteps.length}`
              : "Trace data will appear here when available."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={traceSteps.length === 0 || traceIndex === 0}
            onClick={onBack}
            className="rounded-md border border-white/10 px-2 py-1 text-xs text-gray-300 disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            disabled={traceSteps.length <= 1}
            onClick={onTogglePlay}
            className="rounded-md border border-indigo-400/20 bg-indigo-500/10 px-2 py-1 text-xs text-indigo-200 disabled:opacity-40"
          >
            {isTracePlaying ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            disabled={traceSteps.length === 0 || traceIndex >= traceSteps.length - 1}
            onClick={onNext}
            className="rounded-md border border-white/10 px-2 py-1 text-xs text-gray-300 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col">
        <ExecutionFlow traceSteps={traceSteps} activeIndex={traceIndex} />
      </div>
    </div>
  );
}
