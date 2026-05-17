"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type * as Monaco from "monaco-editor";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import AnalysisPanel from "../../components/analysis-panel";
import ChatContainer from "@/components/chat/ChatContainer";
import {
  fetchSessionDetail,
  type BufferedExecution,
  type SessionDetail,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useSessionBuffer } from "@/hooks/useSessionBuffer";
import { getStoredThreadId, setStoredThreadId } from "@/hooks/useLocalChat";

type AnalysisData = {
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
  error?: {
    message?: string;
  };
};

type TraceStep = {
  step: number;
  line_number?: number | null;
  event_type?: string | null;
  variables?: Record<string, unknown> | null;
  call_stack?: string[] | null;
  return_value?: unknown;
};

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function EditorWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken, loading: authLoading, session, signOut } = useAuth();
  const [code, setCode] = useState("console.log(2+3)");
  const [language, setLanguage] = useState("javascript");
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
  const [traceSteps, setTraceSteps] = useState<TraceStep[]>([]);
  const [traceIndex, setTraceIndex] = useState(0);
  const [isTracePlaying, setIsTracePlaying] = useState(false);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const decorationIdsRef = useRef<string[]>([]);
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

    const firstLine = code.split("\n").find((line) => line.trim().length > 0);
    return firstLine ? firstLine.trim().slice(0, 80) : "Untitled session";
  }, [activeRestoredSessionTitle, code]);

  const chatContext = useMemo(
    () => ({
      title: derivedTitle,
      language,
      code,
      analysis,
      execution: result,
    }),
    [analysis, code, derivedTitle, language, result]
  );
  const currentTraceStep = traceSteps[traceIndex] ?? null;
  const traceVariables = currentTraceStep?.variables
    ? Object.entries(currentTraceStep.variables)
    : [];

  useEffect(() => {
    if (requestedSessionId && accessToken) {
      return;
    }

    const timer = window.setTimeout(() => {
      const threadId = getStoredThreadId();
      setStoredThreadId(threadId);
      setChatThreadId(threadId);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      void flush();
    };
  }, [accessToken, flush, requestedSessionId]);

  useEffect(() => {
    if (!isTracePlaying || traceSteps.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setTraceIndex((current) => {
        if (current >= traceSteps.length - 1) {
          setIsTracePlaying(false);
          return current;
        }

        return current + 1;
      });
    }, 800);

    return () => {
      window.clearInterval(timer);
    };
  }, [isTracePlaying, traceSteps.length]);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (!editor || !monaco) {
      return;
    }

    const lineNumber = currentTraceStep?.line_number;
    if (!lineNumber) {
      decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, []);
      return;
    }

    decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, [
      {
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: true,
          className: "codevista-active-line",
          glyphMarginClassName: "codevista-active-line-glyph",
        },
      },
    ]);

    editor.revealLineInCenter(lineNumber);
  }, [currentTraceStep]);

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
          setTraceIndex(0);
          setIsTracePlaying(false);
        } else {
          setResult(null);
          setAnalysis(null);
          setTraceSteps([]);
          setTraceIndex(0);
          setIsTracePlaying(false);
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
    try {
      setLoading(true);
      setAnalysisLoading(true);
      setExecutionError(null);
      setAnalysisError(null);
      setActiveTab("output");
      setAnalysis(null);
      setTraceSteps([]);
      setTraceIndex(0);
      setIsTracePlaying(false);

      const payload = JSON.stringify({ code, language });
      const headers = {
        "Content-Type": "application/json",
      };

      const executionRequest = fetch(`${API_BASE_URL}/execution`, {
        method: "POST",
        headers,
        body: payload,
      });
      const analysisRequest = fetch(`${API_BASE_URL}/analysis`, {
        method: "POST",
        headers,
        body: payload,
      })
        .then(async (response) => ({
          response,
          data: await response.json(),
        }))
        .catch((error) => ({
          response: null as Response | null,
          data: null as unknown,
          error,
        }));

      const executionRes = await executionRequest;
      const executionData = await executionRes.json();

      if (!executionRes.ok || executionData.error) {
        setExecutionError(
          executionData?.error?.message ||
            "⚠️ Unable to run code. Please try again."
        );
        setResult(null);
        return;
      }

      setResult(executionData);
      setLoading(false);

      const analysisResult = await analysisRequest;
      const analysisRes = analysisResult.response;
      const analysisData = analysisResult.data as
        | {
            error?: string;
            message?: string;
            pseudocode?: string[];
            algorithm_steps?: string[];
            time_complexity?: {
              best: string;
              average: string;
              worst: string;
            };
            space_complexity?: string;
            execution_trace?: unknown[];
            explanation?: string;
          }
        | null;

      if (!analysisRes || analysisResult.error || !analysisData || analysisData.error) {
        setAnalysisError(
          analysisData?.message ||
            "⚠️ Analysis is unavailable right now. Please try again."
        );
        return;
      }

      setAnalysis(analysisData);
      const nextTraceSteps = normalizeTrace(analysisData.execution_trace || []);
      setTraceSteps(nextTraceSteps);
      setTraceIndex(0);
      setIsTracePlaying(false);

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
          derivedTitle
        );
      }
    } catch {
      setExecutionError("🌐 Network error. Please check your connection.");
    } finally {
      setLoading(false);
      setAnalysisLoading(false);
    }
  };

  if (authLoading || restoringSession) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#020617] text-sm text-gray-400">
        {restoringSession ? "Restoring saved session..." : "Loading workspace..."}
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex justify-center px-3 py-3">
      <div className="w-full max-w-[1400px] min-h-[calc(100vh-24px)] flex flex-col">
        <div className="mb-3 flex items-center justify-between px-1">
          <div>
            <h1 className="text-lg font-semibold text-indigo-400">CodeVista</h1>
            <p className="text-[11px] text-gray-400">
              {session ? "Interactive Code Workspace" : "Interactive Code Workspace · Guest mode"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] text-gray-500 uppercase">
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

        <div className="flex-1 min-h-0 p-[12px] rounded-2xl bg-[#0b1220]/60 border border-white/10 backdrop-blur-xl">
          <div className="h-full min-h-0 rounded-xl overflow-hidden border border-white/5 flex flex-col lg:flex-row">
            <div className="lg:w-[70%] min-h-[420px] lg:min-h-0 flex flex-col bg-[#0f172a]">
              <div className="flex items-center gap-3 px-4 py-2 border-b border-white/10 bg-[#111827]">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-1.5 bg-[#020617] border border-white/10 rounded-md text-sm"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                </select>

                <button
                  onClick={runCode}
                  disabled={loading}
                  className="ml-auto px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 rounded-md text-sm font-medium"
                >
                  {loading ? "Running..." : "Run ▶"}
                </button>
              </div>

              <div className="flex-1 min-h-[320px] lg:min-h-0">
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
              </div>
            </div>

            <div className="lg:w-[30%] min-h-[380px] lg:min-h-0 flex flex-col bg-[#0b1220] p-4 gap-4">
              {executionError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {executionError}
                </div>
              )}
              {saveError && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
                  {saveError}
                </div>
              )}
              {requestedSessionId && activeRestoredSessionTitle && (
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-sm">
                  Restored session: {activeRestoredSessionTitle}
                </div>
              )}

              <div>
                <h3 className="text-sm text-gray-300 mb-3">Performance</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-[#111827] border border-white/10">
                    <p className="text-xs text-gray-400">Runtime</p>
                    <p className="text-indigo-400 font-mono text-lg">
                      {result?.runtime_ms ?? "--"} ms
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#111827] border border-white/10">
                    <p className="text-xs text-gray-400">Memory</p>
                    <p className="text-green-400 font-mono text-lg">
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
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm text-gray-300">Console</h3>

                        {result && (
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              result.stderr
                                ? "bg-red-500/20 text-red-400"
                                : "bg-green-500/20 text-green-400"
                            }`}
                          >
                            {result.stderr ? "Error" : "Success"}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-h-[220px] rounded-xl bg-[#020617] border border-white/10 p-4 font-mono text-sm overflow-auto">
                        {result?.error ? (
                          <div className="text-yellow-400 whitespace-pre-wrap">
                            ⚠️ {result.error.message}
                          </div>
                        ) : result?.stderr ? (
                          <div className="text-red-400 whitespace-pre-wrap">
                            ❌ Error:
                            {"\n"}
                            {result.stderr}
                          </div>
                        ) : result?.stdout ? (
                          <div className="text-gray-200 whitespace-pre-wrap">
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
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm text-gray-300">Analysis</h3>
                        {analysisLoading && (
                          <span className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-300">
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

              <div className="rounded-xl border border-white/10 bg-[#111827] p-3">
                <div className="mb-3 flex items-center justify-between">
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
                      onClick={() => {
                        setIsTracePlaying(false);
                        setTraceIndex((current) => Math.max(current - 1, 0));
                      }}
                      className="rounded-md border border-white/10 px-2 py-1 text-xs text-gray-300 disabled:opacity-40"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={traceSteps.length <= 1}
                      onClick={() => {
                        setIsTracePlaying((current) => !current);
                      }}
                      className="rounded-md border border-indigo-400/20 bg-indigo-500/10 px-2 py-1 text-xs text-indigo-200 disabled:opacity-40"
                    >
                      {isTracePlaying ? "Pause" : "Play"}
                    </button>
                    <button
                      type="button"
                      disabled={
                        traceSteps.length === 0 || traceIndex >= traceSteps.length - 1
                      }
                      onClick={() => {
                        setIsTracePlaying(false);
                        setTraceIndex((current) =>
                          Math.min(current + 1, traceSteps.length - 1)
                        );
                      }}
                      className="rounded-md border border-white/10 px-2 py-1 text-xs text-gray-300 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-white/10 bg-[#0b1220] p-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">
                        Active Line
                      </p>
                      <p className="mt-2 font-mono text-sm text-indigo-300">
                        {currentTraceStep?.line_number ?? "--"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-[#0b1220] p-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">
                        Event
                      </p>
                      <p className="mt-2 font-mono text-sm text-cyan-300">
                        {currentTraceStep?.event_type ?? "--"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-[#0b1220] p-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">
                        Return Flow
                      </p>
                      <p className="mt-2 font-mono text-sm text-emerald-300 break-all">
                        {currentTraceStep?.return_value == null
                          ? "--"
                          : JSON.stringify(currentTraceStep.return_value)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-white/10 bg-[#0b1220] p-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">
                        Call Stack
                      </p>
                      <div className="mt-2 space-y-2">
                        {currentTraceStep?.call_stack?.length ? (
                          currentTraceStep.call_stack.map((frame, index) => (
                            <div
                              key={`${frame}-${index}`}
                              className="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs text-amber-200"
                            >
                              {frame}
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-gray-500">
                            No call stack data yet.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-[#0b1220] p-3">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">
                        Variable State
                      </p>
                      <div className="mt-2 space-y-2">
                        {traceVariables.length > 0 ? (
                          traceVariables.map(([name, value]) => (
                            <div
                              key={name}
                              className="flex items-start justify-between gap-3 rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs"
                            >
                              <span className="text-sky-200">{name}</span>
                              <span className="text-gray-300 break-all text-right">
                                {JSON.stringify(value)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-gray-500">
                            No variable snapshot data yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {chatThreadId ? (
        <ChatContainer
          threadId={chatThreadId}
          title={derivedTitle}
          sessionId={sessionId}
          accessToken={accessToken}
          context={chatContext}
        />
      ) : null}

      <style jsx global>{`
        .codevista-active-line {
          background: rgba(99, 102, 241, 0.18);
          border-top: 1px solid rgba(99, 102, 241, 0.45);
          border-bottom: 1px solid rgba(99, 102, 241, 0.3);
        }

        .codevista-active-line-glyph {
          background: linear-gradient(180deg, #818cf8, #6366f1);
          width: 6px !important;
          margin-left: 6px;
          border-radius: 999px;
        }
      `}</style>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-[#020617] text-sm text-gray-400">
          Loading workspace...
        </main>
      }
    >
      <EditorWorkspace />
    </Suspense>
  );
}
