"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TraceExplorer } from "@/components/visualizer/trace-explorer";
import { TraceInspector } from "@/components/visualizer/trace-inspector";
import {
  readTraceWorkspaceSnapshot,
  subscribeToTraceWorkspace,
  type TraceWorkspaceSnapshot,
} from "@/lib/trace-workspace";

function TraceWorkspaceView({ snapshot }: { snapshot: TraceWorkspaceSnapshot }) {
  const [traceIndex, setTraceIndex] = useState(0);
  const [isTracePlaying, setIsTracePlaying] = useState(false);
  const currentTraceStep = snapshot.traceSteps[traceIndex] ?? null;

  useEffect(() => {
    if (!isTracePlaying || snapshot.traceSteps.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setTraceIndex((current) => {
        const maxIndex = snapshot.traceSteps.length - 1;
        if (current >= maxIndex) {
          setIsTracePlaying(false);
          return 0;
        }

        return current + 1;
      });
    }, 800);

    return () => {
      window.clearInterval(timer);
    };
  }, [isTracePlaying, snapshot]);

  return (
    <>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">
            Language
          </p>
          <p className="mt-2 text-lg font-medium text-indigo-300">
            {snapshot.language}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">
            Runtime
          </p>
          <p className="mt-2 font-mono text-lg text-cyan-300">
            {snapshot.runtimeMs ?? "--"} ms
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">
            Memory
          </p>
          <p className="mt-2 font-mono text-lg text-emerald-300">
            {snapshot.memoryKb ?? "--"} KB
          </p>
        </div>
      </div>

      <div className="grid flex-1 min-h-0 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.85fr)]">
        <TraceExplorer
          traceSteps={snapshot.traceSteps}
          traceIndex={traceIndex}
          isTracePlaying={isTracePlaying}
          onBack={() => {
            setIsTracePlaying(false);
            setTraceIndex((current) => Math.max(current - 1, 0));
          }}
          onNext={() => {
            setIsTracePlaying(false);
            setTraceIndex((current) =>
              Math.min(current + 1, snapshot.traceSteps.length - 1)
            );
          }}
          onTogglePlay={() => {
            if (traceIndex >= snapshot.traceSteps.length - 1) {
              setTraceIndex(0);
              setIsTracePlaying(true);
              return;
            }

            setIsTracePlaying((current) => !current);
          }}
        />

        <div className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-[#111827] p-4">
          <div className="mb-3">
            <h2 className="text-sm text-gray-200">Trace Details</h2>
            <p className="text-[11px] text-gray-500">
              Call stack, variable state, and source snapshot for the current step.
            </p>
          </div>
          <div className="min-h-0 flex-1">
            <TraceInspector
              currentStep={currentTraceStep}
              sourceCode={snapshot.code}
              traceSteps={snapshot.traceSteps}
              activeIndex={traceIndex}
              onSelectStep={(index) => {
                setIsTracePlaying(false);
                setTraceIndex(index);
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default function EditorInsightsPage() {
  const router = useRouter();
  const snapshot = useSyncExternalStore(
    subscribeToTraceWorkspace,
    readTraceWorkspaceSnapshot,
    () => null
  );

  return (
    <main className="min-h-screen bg-[#020617] px-4 py-4 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-32px)] w-full max-w-[1400px] flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-indigo-300">
              Visualizer
            </p>
            <h1 className="text-xl font-semibold text-white">
              {snapshot?.title || "Execution Insights"}
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              {snapshot
                ? `${snapshot.language} trace view with card-synced step controls.`
                : "Open this page from the editor after running code to inspect the trace."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/editor")}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Editor
          </button>
        </div>

        {snapshot ? (
          <TraceWorkspaceView
            key={`${snapshot.capturedAt}-${snapshot.sessionId ?? "local"}`}
            snapshot={snapshot}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0b1220] p-8 text-center text-sm text-gray-400">
            No trace snapshot is available yet. Run code in the editor, then open the
            visualizer tab.
          </div>
        )}
      </div>
    </main>
  );
}
