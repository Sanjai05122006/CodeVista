"use client";

import { Suspense, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Database, LaptopMinimal } from "lucide-react";
import { TraceExplorer } from "@/components/visualizer/trace-explorer";
import { TraceInspector } from "@/components/visualizer/trace-inspector";
import { useAuth } from "@/lib/auth-context";
import {
  fetchSessionDetail,
  type SessionDetail,
} from "@/lib/api";
import {
  readTraceWorkspaceSnapshot,
  subscribeToTraceWorkspace,
  type TraceWorkspaceSnapshot,
} from "@/lib/trace-workspace";
import { resolveSessionTitle } from "@/lib/session-title";
import type { TraceStep } from "@/lib/trace-visualizer";

const normalizeTraceSteps = (trace: unknown): TraceStep[] => {
  if (!Array.isArray(trace)) {
    return [];
  }

  return trace
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object"
    )
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
        item.variables &&
        typeof item.variables === "object" &&
        !Array.isArray(item.variables)
          ? (item.variables as Record<string, unknown>)
          : null,
      call_stack: Array.isArray(item.call_stack)
        ? item.call_stack.filter((entry): entry is string => typeof entry === "string")
        : null,
      return_value: "return_value" in item ? item.return_value : null,
    }));
};

function buildSnapshotFromSession(
  detail: SessionDetail
): TraceWorkspaceSnapshot | null {
  const latestExecution = detail.executions[detail.executions.length - 1];

  if (!latestExecution) {
    return null;
  }

  return {
    title: resolveSessionTitle({
      code: latestExecution.code,
      preferredTitle: detail.title,
      analysisData: latestExecution.analysis
        ? {
            algorithm_name: latestExecution.analysis.algorithm_name,
            pseudocode: latestExecution.analysis.pseudocode,
            algorithm_steps: latestExecution.analysis.algorithm_steps,
          }
        : null,
    }),
    language: latestExecution.language,
    code: latestExecution.code,
    traceSteps: normalizeTraceSteps(latestExecution.analysis?.execution_trace),
    runtimeMs: latestExecution.output.runtime_ms ?? null,
    memoryKb: latestExecution.output.memory_kb ?? null,
    sessionId: detail.id,
    capturedAt: latestExecution.updated_at ?? detail.updated_at ?? detail.created_at,
  };
}

function TraceWorkspaceView({ snapshot }: { snapshot: TraceWorkspaceSnapshot }) {
  const [traceIndex, setTraceIndex] = useState(0);
  const [isTracePlaying, setIsTracePlaying] = useState(false);
  const currentTraceStep = snapshot.traceSteps[traceIndex] ?? null;

  useEffect(() => {
    setTraceIndex(0);
    setIsTracePlaying(false);
  }, [snapshot.capturedAt, snapshot.sessionId]);

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
  }, [isTracePlaying, snapshot.traceSteps.length]);

  return (
    <>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">
            Language
          </p>
          <p className="mt-2 text-lg font-medium text-sky-300">
            {snapshot.language}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">
            Runtime
          </p>
          <p className="mt-2 font-mono text-lg text-indigo-300">
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
        <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">
            Trace Steps
          </p>
          <p className="mt-2 font-mono text-lg text-amber-300">
            {snapshot.traceSteps.length}
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

function EditorInsightsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken, loading: authLoading } = useAuth();
  const requestedSessionId = searchParams.get("sessionId");
  const localSnapshot = useSyncExternalStore(
    subscribeToTraceWorkspace,
    readTraceWorkspaceSnapshot,
    () => null
  );
  const [sessionSnapshot, setSessionSnapshot] =
    useState<TraceWorkspaceSnapshot | null>(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestedSessionId || !accessToken) {
      setSessionSnapshot(null);
      if (!requestedSessionId) {
        setLoadError(null);
      }
      return;
    }

    let active = true;

    void (async () => {
      setLoadingSnapshot(true);
      setLoadError(null);

      try {
        const detail = await fetchSessionDetail(requestedSessionId, accessToken);

        if (!active) {
          return;
        }

        const nextSnapshot = buildSnapshotFromSession(detail);
        setSessionSnapshot(nextSnapshot);

        if (!nextSnapshot) {
          setLoadError("This saved session does not contain an execution trace yet.");
        }
      } catch (error) {
        if (!active) {
          return;
        }

        setSessionSnapshot(null);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to restore the saved trace."
        );
      } finally {
        if (active) {
          setLoadingSnapshot(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [accessToken, requestedSessionId]);

  const activeSnapshot = useMemo(() => {
    if (sessionSnapshot) {
      return sessionSnapshot;
    }

    if (
      localSnapshot &&
      (!requestedSessionId || localSnapshot.sessionId === requestedSessionId)
    ) {
      return localSnapshot;
    }

    return requestedSessionId ? null : localSnapshot;
  }, [localSnapshot, requestedSessionId, sessionSnapshot]);

  const sourceBadge = sessionSnapshot
    ? {
        label: "Saved Session",
        icon: Database,
      }
    : activeSnapshot
    ? {
        label: "Local Workspace",
        icon: LaptopMinimal,
      }
    : null;

  return (
    <main className="min-h-screen bg-[#020617] px-4 py-4 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-32px)] w-full max-w-[1400px] flex-col gap-4">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0b1220] px-5 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-indigo-300">
              Visualizer
            </p>
            <h1 className="text-xl font-semibold text-white">
              {activeSnapshot?.title || "Execution Insights"}
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              {activeSnapshot
                ? `${activeSnapshot.language} trace view with dedicated playback and inspection.`
                : requestedSessionId
                ? "Restore the saved session trace or fall back to the latest local workspace snapshot."
                : "Open this page from the editor after running code to inspect the trace."}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                requestedSessionId
                  ? `/editor?sessionId=${encodeURIComponent(requestedSessionId)}`
                  : "/editor"
              )
            }
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Editor
          </button>
        </div>

        {sourceBadge ? (
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-[#0b1220] px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-gray-300">
            <sourceBadge.icon className="h-3.5 w-3.5" />
            {sourceBadge.label}
          </div>
        ) : null}

        {loadError ? (
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            {loadError}
          </div>
        ) : null}

        {loadingSnapshot || (authLoading && requestedSessionId) ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-[#0b1220] p-8 text-center text-sm text-gray-400">
            Restoring trace workspace...
          </div>
        ) : activeSnapshot ? (
          <TraceWorkspaceView
            key={`${activeSnapshot.capturedAt}-${activeSnapshot.sessionId ?? "local"}`}
            snapshot={activeSnapshot}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0b1220] p-8 text-center text-sm text-gray-400">
            {requestedSessionId
              ? "No saved trace could be restored for this session. Open the session in the editor and run it again if needed."
              : "No trace snapshot is available yet. Run code in the editor, then open the visualizer."}
          </div>
        )}
      </div>
    </main>
  );
}

export default function EditorInsightsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#020617] px-4 py-4 text-white">
          <div className="mx-auto flex min-h-[calc(100vh-32px)] w-full max-w-[1400px] items-center justify-center rounded-2xl border border-white/10 bg-[#0b1220] p-8 text-sm text-gray-400">
            Loading visualizer...
          </div>
        </main>
      }
    >
      <EditorInsightsWorkspace />
    </Suspense>
  );
}
