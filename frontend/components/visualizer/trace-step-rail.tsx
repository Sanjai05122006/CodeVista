"use client";

import { useEffect, useRef } from "react";
import type { TraceStep } from "@/lib/trace-visualizer";

type TraceStepRailProps = {
  traceSteps: TraceStep[];
  activeIndex: number;
  onSelectStep: (index: number) => void;
};

const summarizeStep = (step: TraceStep) => {
  const variableKeys =
    step.variables && typeof step.variables === "object"
      ? Object.keys(step.variables).slice(0, 2)
      : [];

  if (step.event_type === "return" && step.return_value != null) {
    return `returns ${JSON.stringify(step.return_value)}`;
  }

  if (variableKeys.length > 0) {
    return variableKeys.join(" • ");
  }

  return "No variable snapshot";
};

export function TraceStepRail({
  traceSteps,
  activeIndex,
  onSelectStep,
}: TraceStepRailProps) {
  const activeCardRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeCardRef.current?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    });
  }, [activeIndex]);

  if (traceSteps.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-[#0b1220] p-4 text-sm text-gray-500">
        Step cards will appear here when trace data is available.
      </div>
    );
  }

  return (
    <div className="flex max-h-[280px] flex-col gap-2 overflow-auto rounded-2xl border border-white/10 bg-[#0b1220] p-3">
      {traceSteps.map((step, index) => {
        const isActive = index === activeIndex;

        return (
          <button
            key={`${step.step}-${index}`}
            ref={isActive ? activeCardRef : null}
            type="button"
            onClick={() => onSelectStep(index)}
            className={`rounded-xl border px-3 py-3 text-left transition ${
              isActive
                ? "border-indigo-400/50 bg-indigo-500/15 shadow-[0_0_0_1px_rgba(99,102,241,0.18)]"
                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-xs text-indigo-200">
                Step {step.step}
              </span>
              <span className="rounded-full border border-white/10 bg-[#020617] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-300">
                {step.event_type ?? "step"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-white">
                Line {step.line_number ?? "--"}
              </p>
              <p className="text-[11px] text-slate-400">
                Depth {step.call_stack?.length ?? 0}
              </p>
            </div>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">
              {summarizeStep(step)}
            </p>
          </button>
        );
      })}
    </div>
  );
}
