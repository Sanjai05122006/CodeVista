"use client";

import { useState } from "react";
import {
  normalizeVariableEntries,
  type TraceStep,
} from "@/lib/trace-visualizer";
import { TraceStepRail } from "./trace-step-rail";

type TraceInspectorProps = {
  currentStep: TraceStep | null;
  sourceCode: string;
  traceSteps: TraceStep[];
  activeIndex: number;
  onSelectStep: (index: number) => void;
};

const kindStyles = {
  primitive: "border-white/10 bg-[#111827] text-slate-300",
  array: "border-white/10 bg-[#111827] text-sky-300",
  object: "border-white/10 bg-[#111827] text-amber-200",
};

export function TraceInspector({
  currentStep,
  sourceCode,
  traceSteps,
  activeIndex,
  onSelectStep,
}: TraceInspectorProps) {
  const [activeTab, setActiveTab] = useState<
    "stack" | "variables" | "source" | "steps"
  >("stack");
  const variables = normalizeVariableEntries(currentStep?.variables);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-white/10 bg-[#0b1220] p-3">
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111827] p-1">
        <button
          type="button"
          onClick={() => setActiveTab("stack")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm transition ${
            activeTab === "stack"
              ? "bg-indigo-500 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Call Stack
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("variables")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm transition ${
            activeTab === "variables"
              ? "bg-indigo-500 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Variable State
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("source")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm transition ${
            activeTab === "source"
              ? "bg-indigo-500 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Source Snapshot
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("steps")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm transition ${
            activeTab === "steps"
              ? "bg-indigo-500 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Trace Steps
        </button>
      </div>

      <div className="mt-3 min-h-0 flex-1">
        {activeTab === "stack" ? (
          currentStep?.call_stack?.length ? (
            <div className="h-full space-y-2 overflow-auto pr-1">
              {currentStep.call_stack.map((frame, index) => (
                <div
                  key={`${frame}-${index}`}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-amber-100"
                >
                  {index + 1}. {frame}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-white/10 px-3 py-3 text-xs text-gray-500">
              No call stack data yet.
            </div>
          )
        ) : null}

        {activeTab === "variables" ? (
          <div className="flex h-full min-h-0 flex-col">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">
                Variable State
              </p>
              {currentStep?.return_value != null ? (
                <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] text-emerald-200">
                  Return {JSON.stringify(currentStep.return_value)}
                </span>
              ) : null}
            </div>

            <div className="flex max-h-[280px] flex-col gap-2 overflow-auto rounded-2xl border border-white/10 bg-[#0b1220] p-3">
              {variables.length > 0 ? (
                variables.map((entry) => (
                  <div
                    key={entry.key}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left transition hover:border-white/20 hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-xs text-indigo-200">
                        {entry.key}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${kindStyles[entry.kind]}`}
                      >
                        {entry.kind}
                      </span>
                    </div>
                    <div className="mt-2 max-h-32 overflow-auto rounded-md bg-[#020617] px-2 py-2 font-mono text-xs text-slate-300">
                      {entry.value}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-white/10 px-3 py-3 text-xs text-gray-500">
                  No variable snapshot data yet.
                </div>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "source" ? (
          <pre className="h-full min-h-0 overflow-auto rounded-xl border border-white/10 bg-[#020617] p-4 font-mono text-xs text-gray-300">
            <code>{sourceCode || "// No code snapshot available."}</code>
          </pre>
        ) : null}

        {activeTab === "steps" ? (
          <TraceStepRail
            traceSteps={traceSteps}
            activeIndex={activeIndex}
            onSelectStep={onSelectStep}
          />
        ) : null}
      </div>
    </div>
  );
}
