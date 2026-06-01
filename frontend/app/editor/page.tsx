"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { loader } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import AnalysisPanel from "../../components/analysis-panel";
import ChatContainer from "@/components/chat/ChatContainer";
import { StatusCard } from "@/components/ui/StatusCard";
import {
  fetchSessionDetail,
  runWorkspace,
  type BufferedExecution,
  type SessionDetail,
  type WorkspaceAnalysisResult,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useSessionBuffer } from "@/hooks/useSessionBuffer";
import { getStoredThreadId, setStoredThreadId } from "@/hooks/useLocalChat";
import { saveTraceWorkspaceSnapshot } from "@/lib/trace-workspace";
import { type TraceStep } from "@/lib/trace-visualizer";
import { deriveSessionTitle } from "@/lib/session-title";

type AnalysisData = {
  algorithm_name: string;
  pseudocode: string[];
  algorithm_steps: string[];
  time_complexity: {
    best: string;
    average: string;
    worst: string;
  };
  space_complexity: string;
  source: "cache" | "gemini" | "groq";
};

type ExecutionData = {
  stdout?: string;
  stderr?: string;
  runtime_ms?: number;
  memory_kb?: number;
  status?: string;
  source?: string;
  error?: {
    code?: string;
    message?: string;
  };
};

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

let monacoLoaderPromise: Promise<void> | null = null;

const ensureMonacoLoader = async () => {
  if (!monacoLoaderPromise) {
    monacoLoaderPromise = import("monaco-editor")
      .then((monaco) => {
        loader.config({ monaco });
        return loader.init();
      })
      .then(() => undefined);
  }

  return monacoLoaderPromise;
};

function EditorWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken, loading: authLoading, session, signOut } = useAuth();
  const [code, setCode] = useState("console.log(2+3)");
  const [language, setLanguage] = useState("javascript");
  const [stdin, setStdin] = useState("");
  const [monacoReady, setMonacoReady] = useState(false);
  const [monacoError, setMonacoError] = useState<string | null>(null);
  const [result, setResult] = useState<ExecutionData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"output" | "analysis">("output");
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [chatThreadId, setChatThreadId] = useState("");
  const [restoringSession, setRestoringSession] = useState(false);
  const [restoredSessionTitle, setRestoredSessionTitle] = useState<string | null>(null);
  const [hasRestoredConversation, setHasRestoredConversation] = useState(false);
  const [traceSteps, setTraceSteps] = useState<TraceStep[]>([]);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const { appendExecution, flush, hydrateSession, saveError, sessionId } =
    useSessionBuffer(accessToken);
  const requestedSessionId = searchParams.get("sessionId");
  const activeRestoredSessionTitle = requestedSessionId ? restoredSessionTitle : null;

  const normalizeTrace = (trace: unknown): TraceStep[] => {
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
        event_type:
          typeof item.event_type === "string" ? item.event_type : null,
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

  const derivedTitle = useMemo(() => {
    if (activeRestoredSessionTitle) {
      return activeRestoredSessionTitle;
    }

    return deriveSessionTitle(code, analysis);
  }, [activeRestoredSessionTitle, analysis, code]);

  const chatContext = useMemo(
    () => ({
      title: derivedTitle,
      language,
      code,
      stdin,
      analysis,
      execution: result,
      trace: {
        total_steps: traceSteps.length,
        preview: traceSteps.slice(0, 5),
      },
    }),
    [analysis, code, derivedTitle, language, result, stdin, traceSteps]
  );

  useEffect(() => {
    let active = true;

    void ensureMonacoLoader()
      .then(() => {
        if (!active) {
          return;
        }

        setMonacoReady(true);
        setMonacoError(null);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setMonacoError(
          error instanceof Error ? error.message : "Monaco failed to initialize."
        );
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (requestedSessionId && accessToken) {
      return;
    }

    const timer = window.setTimeout(() => {
      setHasRestoredConversation(false);
      const threadId = getStoredThreadId();
      setStoredThreadId(threadId);
      setChatThreadId(threadId);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      void flush().catch(() => {
        // Save errors are already surfaced through workspace state.
      });
    };
  }, [accessToken, flush, requestedSessionId]);

  useEffect(() => {
    saveTraceWorkspaceSnapshot({
      title: derivedTitle,
      language,
      code,
      traceSteps,
      runtimeMs: result?.runtime_ms ?? null,
      memoryKb: result?.memory_kb ?? null,
      sessionId: sessionId ?? requestedSessionId ?? null,
      capturedAt: new Date().toISOString(),
    });
  }, [code, derivedTitle, language, requestedSessionId, result, sessionId, traceSteps]);

  useEffect(() => {
    if (!requestedSessionId || !accessToken) {
      return;
    }

    let active = true;

    const toBufferedExecution = (
      detail: SessionDetail
    ): BufferedExecution[] =>
      detail.executions.map((execution) => ({
        code: execution.code,
        language: execution.language,
        output: execution.output.stdout || "",
        error: execution.output.stderr || "",
        runtime: execution.output.runtime_ms || 0,
        memory: execution.output.memory_kb || 0,
        ai: {
          algorithmName: execution.analysis?.algorithm_name || undefined,
          pseudocode: execution.analysis?.pseudocode || [],
          explanation: execution.analysis?.explanation || "",
          complexity: {
            time: {
              best: execution.analysis?.time_complexity.best || "",
              average: execution.analysis?.time_complexity.average || "",
              worst: execution.analysis?.time_complexity.worst || "",
            },
            space: execution.analysis?.space_complexity || "",
          },
          trace: execution.analysis?.execution_trace || [],
          algorithmSteps: execution.analysis?.algorithm_steps || [],
        },
      }));

    void (async () => {
      setRestoringSession(true);
      setExecutionError(null);
      setAnalysisError(null);

      try {
        const detail = await fetchSessionDetail(requestedSessionId, accessToken);

        if (!active) {
          return;
        }

        const latestExecution =
          detail.executions[detail.executions.length - 1] ?? null;

        if (latestExecution) {
          setCode(latestExecution.code);
          setLanguage(latestExecution.language);
          setResult({
            stdout: latestExecution.output.stdout,
            stderr: latestExecution.output.stderr,
            runtime_ms: latestExecution.output.runtime_ms,
            memory_kb: latestExecution.output.memory_kb,
          });
          setAnalysis(
            latestExecution.analysis
              ? {
                  algorithm_name: latestExecution.analysis.algorithm_name || "",
                  pseudocode: latestExecution.analysis.pseudocode,
                  algorithm_steps: latestExecution.analysis.algorithm_steps,
                  time_complexity: {
                    best: latestExecution.analysis.time_complexity.best || "",
                    average: latestExecution.analysis.time_complexity.average || "",
                    worst: latestExecution.analysis.time_complexity.worst || "",
                  },
                  space_complexity: latestExecution.analysis.space_complexity,
                  source: "cache",
                }
              : null
          );
          const restoredTrace = normalizeTrace(
            latestExecution.analysis?.execution_trace ?? []
          );
          setTraceSteps(restoredTrace);
        } else {
          setResult(null);
          setAnalysis(null);
          setTraceSteps([]);
        }

        setActiveTab("analysis");
        setRestoredSessionTitle(detail.title || null);
        hydrateSession({
          sessionId: detail.id,
          title: detail.title,
          startedAt: detail.created_at,
          executions: toBufferedExecution(detail),
        });

        const restoredThreadId = detail.chat?.thread_id || getStoredThreadId();
        setStoredThreadId(restoredThreadId);
        setChatThreadId(restoredThreadId);
        setHasRestoredConversation(
          Boolean(detail.chat?.messages && detail.chat.messages.length > 0)
        );
      } catch (error) {
        if (!active) {
          return;
        }

        setExecutionError(
          error instanceof Error
            ? error.message
            : "Unable to restore the saved session."
        );
        const fallbackThreadId = getStoredThreadId();
        setStoredThreadId(fallbackThreadId);
        setChatThreadId(fallbackThreadId);
        setHasRestoredConversation(false);
      } finally {
        if (active) {
          setRestoringSession(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [accessToken, hydrateSession, requestedSessionId]);

  const runCode = async () => {
    if (!accessToken) {
      setExecutionError(
        "Sign in is required to run code, generate analysis, and view traces in the secured workspace."
      );
      setAnalysisError(
        "Sign in is required to use analysis and trace features."
      );
      setActiveTab("output");
      return;
    }

    try {
      setLoading(true);
      setAnalysisLoading(true);
      setExecutionError(null);
      setAnalysisError(null);
      setActiveTab("output");
      setAnalysis(null);
      setTraceSteps([]);

      const workspace = await runWorkspace({ code, language, stdin }, accessToken);
      const executionData = workspace.execution;
      const analysisData = workspace.analysis;

      setResult(executionData);
      setAnalysis({
        algorithm_name: analysisData.algorithm_name || "",
        pseudocode: analysisData.pseudocode || [],
        algorithm_steps: analysisData.algorithm_steps || [],
        time_complexity: analysisData.time_complexity || {
          best: "",
          average: "",
          worst: "",
        },
        space_complexity: analysisData.space_complexity || "",
        source: analysisData.source || "cache",
      });

      const nextTraceSteps = normalizeTrace(
        workspace.trace?.length ? workspace.trace : analysisData.execution_trace || []
      );
      setTraceSteps(nextTraceSteps);

      if (executionData.error?.message) {
        setExecutionError(executionData.error.message);
      }

      if (!analysisData.algorithm_name && analysisData.pseudocode.length === 0) {
        setAnalysisError("⚠️ Analysis is unavailable right now. Please try again.");
      }

      const nextSessionTitle = deriveSessionTitle(
        code,
        analysisData as WorkspaceAnalysisResult
      );

      if (accessToken) {
        appendExecution(
          {
            code,
            language,
            output: executionData.stdout || "",
            error:
              executionData.stderr ||
              executionData?.error?.message ||
              "",
            runtime: executionData.runtime_ms || 0,
            memory: executionData.memory_kb || 0,
            ai: {
              algorithmName: analysisData.algorithm_name || undefined,
              pseudocode: analysisData.pseudocode || [],
              explanation: analysisData.explanation || "",
              complexity: {
                time: analysisData.time_complexity || {
                  best: "",
                  average: "",
                  worst: "",
                },
                space: analysisData.space_complexity || "",
              },
              trace: analysisData.execution_trace || [],
              algorithmSteps: analysisData.algorithm_steps || [],
            },
          },
          nextSessionTitle
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Request failed.";
      const isAuthFailure =
        message.includes("AUTH_REQUIRED") ||
        message.includes("MISSING_AUTH_TOKEN") ||
        message.includes("INVALID_AUTH_TOKEN") ||
        message.toLowerCase().includes("sign in is required");

      setExecutionError(
        isAuthFailure
          ? "Sign in is required to use execution, analysis, and trace in the secured workspace."
          : "🌐 Network error. Please check your connection."
      );
    } finally {
      setLoading(false);
      setAnalysisLoading(false);
    }
  };

  const openVisualizer = () => {
    const activeSessionId = sessionId ?? requestedSessionId;
    router.push(
      activeSessionId
        ? `/editor/insights?sessionId=${encodeURIComponent(activeSessionId)}`
        : "/editor/insights"
    );
  };

  if (authLoading || restoringSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-sm text-gray-400">
        {restoringSession ? "Restoring saved session..." : "Loading workspace..."}
      </main>
    );
  }

  return (
    <div className="flex min-h-screen justify-center bg-[#020617] px-3 py-3 text-white">
      <div className="flex min-h-[calc(100vh-24px)] w-full max-w-[1400px] flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h1 className="text-lg font-semibold text-indigo-400">
              CodeVista Workspace
            </h1>
            <p className="text-[11px] text-gray-400">
              {session ? "Interactive Code Workspace" : "Interactive Code Workspace · Guest mode"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500">
              {language}
            </span>
            {session ? (
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  router.replace("/");
                }}
                className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-gray-300 transition hover:bg-white/5"
              >
                Sign out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="inline-flex items-center gap-2 rounded-md border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-200 transition hover:bg-indigo-500/20"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign in
              </button>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
            <div className="flex min-h-[420px] flex-col rounded-2xl bg-[#0f172a] lg:min-h-0 lg:w-[70%]">
              <div className="flex items-center gap-3 border-b border-white/10 bg-[#111827] px-4 py-3">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="rounded-md border border-white/10 bg-[#020617] px-3 py-1.5 text-sm text-gray-100 outline-none"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                </select>

                <button
                  onClick={runCode}
                  disabled={loading}
                  className="ml-auto rounded-md bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-600 disabled:opacity-50"
                >
                  {loading ? "Running..." : "Run ▶"}
                </button>
              </div>

              <div className="flex-1 min-h-[320px] lg:min-h-0">
                {monacoError ? (
                  <div className="flex h-full items-center justify-center border-t border-white/5 bg-[#08101d] px-4">
                    <StatusCard
                      variant="dark"
                      tone="error"
                      title="Monaco failed to initialize"
                      message={monacoError}
                      className="h-full w-full max-w-2xl"
                    />
                  </div>
                ) : monacoReady ? (
                  <Editor
                    height="100%"
                    language={language}
                    value={code}
                    theme="vs-dark"
                    onChange={(v) => setCode(v || "")}
                    onMount={(editor, monaco) => {
                      editorRef.current = editor;
                      monacoRef.current = monaco;
                    }}
                    options={{
                      fontSize: 14,
                      glyphMargin: true,
                      minimap: { enabled: false },
                      smoothScrolling: true,
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center border-t border-white/5 bg-[#08101d] text-sm text-gray-400">
                    Loading editor...
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 bg-[#0b1220] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm text-gray-300">Program Input</h3>
                    <p className="text-[11px] text-gray-500">
                      Values sent to `input()` / stdin, one line per entry.
                    </p>
                  </div>
                  {stdin ? (
                    <button
                      type="button"
                      onClick={() => setStdin("")}
                      className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-gray-400 transition hover:bg-white/5 hover:text-white"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                <textarea
                  value={stdin}
                  onChange={(event) => setStdin(event.target.value)}
                  placeholder={"5\nor\nAlice\n42"}
                  className="min-h-[96px] w-full resize-y rounded-xl border border-white/10 bg-[#020617] px-3 py-3 font-mono text-sm text-gray-200 outline-none transition placeholder:text-gray-500 focus:border-indigo-400/50"
                />
              </div>
            </div>

            <div className="flex min-h-[380px] flex-col gap-4 rounded-2xl bg-[#0b1220] p-4 lg:min-h-0 lg:w-[30%]">
              {executionError && (
                <StatusCard
                  variant="dark"
                  tone="error"
                  compact
                  title="Execution failed"
                  message={executionError}
                />
              )}
              {saveError && (
                <StatusCard
                  variant="dark"
                  tone="warning"
                  compact
                  title="Save interrupted"
                  message={saveError}
                />
              )}
              {requestedSessionId && activeRestoredSessionTitle && (
                <StatusCard
                  variant="dark"
                  tone="info"
                  compact
                  title="Restored session"
                  message={`Restored session: ${activeRestoredSessionTitle}`}
                />
              )}

              <div>
                <h3 className="mb-3 text-sm text-gray-300">Performance</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-white/10 bg-[#111827] p-3">
                    <p className="text-xs text-gray-400">Runtime</p>
                    <p className="font-mono text-lg text-indigo-400">
                      {result?.runtime_ms ?? "--"} ms
                    </p>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-[#111827] p-3">
                    <p className="text-xs text-gray-400">Memory</p>
                    <p className="font-mono text-lg text-green-400">
                      {result?.memory_kb ?? "--"} KB
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111827] p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("output")}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm transition ${
                    activeTab === "output"
                      ? "bg-indigo-500 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Output
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("analysis")}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm transition ${
                    activeTab === "analysis"
                      ? "bg-indigo-500 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                    >
                  Analysis
                </button>
                <button
                  type="button"
                  onClick={openVisualizer}
                  disabled={traceSteps.length === 0}
                  className="flex-1 rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Focus Trace
                </button>
              </div>

              <div className="flex-1 min-h-[260px] lg:min-h-0 flex flex-col">
                <AnimatePresence mode="wait">
                  {activeTab === "output" ? (
                    <motion.div
                      key="output"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 min-h-0 flex flex-col"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm text-gray-300">Console</h3>

                        {result && (
                          <span
                            className={`rounded px-2 py-1 text-xs ${
                              result.stderr
                                ? "bg-red-500/20 text-red-400"
                                : "bg-green-500/20 text-green-400"
                            }`}
                          >
                            {result.stderr ? "Error" : "Success"}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-h-[220px] overflow-auto rounded-xl border border-[var(--hairline)] bg-[#111111] p-4 font-mono text-sm text-white">
                        {result?.error ? (
                          <div className="whitespace-pre-wrap text-yellow-300">
                            ⚠️ {result.error.message}
                          </div>
                        ) : result?.stderr ? (
                          <div className="whitespace-pre-wrap text-red-300">
                            ❌ Error:
                            {"\n"}
                            {result.stderr}
                          </div>
                        ) : result?.stdout ? (
                          <div className="whitespace-pre-wrap text-gray-200">
                            {result.stdout}
                          </div>
                        ) : (
                          <div className="text-gray-500">
                            Run your code to see output...
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="analysis"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 min-h-0 flex flex-col"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm text-gray-300">Analysis</h3>
                        {analysisLoading && (
                          <span className="rounded bg-amber-500/20 px-2 py-1 text-xs text-amber-300">
                            Loading
                          </span>
                        )}
                      </div>
                      <AnalysisPanel
                        analysis={analysis}
                        loading={analysisLoading}
                        error={analysisError}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

      </div>

      {chatThreadId && accessToken ? (
        <ChatContainer
          threadId={chatThreadId}
          title={derivedTitle}
          sessionId={sessionId}
          accessToken={accessToken}
          context={chatContext}
          autoOpen={hasRestoredConversation}
          restoredConversation={hasRestoredConversation}
        />
      ) : null}
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#020617] text-sm text-gray-400">
          Loading workspace...
        </main>
      }
    >
      <EditorWorkspace />
    </Suspense>
  );
}
