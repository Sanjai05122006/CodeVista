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
import { saveTraceWorkspaceSnapshot } from "@/lib/trace-workspace";
import { type TraceStep } from "@/lib/trace-visualizer";

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
  const [stdin, setStdin] = useState("");
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

      const executionPayload = JSON.stringify({ code, language, stdin });
      const headers = {
        "Content-Type": "application/json",
      };

      const executionRequest = fetch(`${API_BASE_URL}/execution`, {
        method: "POST",
        headers,
        body: executionPayload,
      });
      const analysisRequest = fetch(`${API_BASE_URL}/analysis`, {
        method: "POST",
        headers,
        body: executionPayload,
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
      const analysisRequestError =
        "error" in analysisResult ? analysisResult.error : null;
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
            source?: "cache" | "gemini" | "groq";
            execution_trace?: unknown[];
            explanation?: string;
          }
        | null;

      if (!analysisRes || analysisRequestError || !analysisData || analysisData.error) {
        setAnalysisError(
          analysisData?.message ||
            "⚠️ Analysis is unavailable right now. Please try again."
        );
        return;
      }

      setAnalysis({
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
      const nextTraceSteps = normalizeTrace(analysisData.execution_trace || []);
      setTraceSteps(nextTraceSteps);

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
      <div className="w-full max-w-[1400px] min-h-[calc(100vh-24px)] flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
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

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
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

              <div className="border-t border-white/10 bg-[#0b1220] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm text-gray-200">Program Input</h3>
                    <p className="text-[11px] text-gray-500">
                      Values sent to `input()` / stdin, one line per entry.
                    </p>
                  </div>
                  {stdin ? (
                    <button
                      type="button"
                      onClick={() => setStdin("")}
                      className="rounded-md border border-white/10 px-2.5 py-1 text-[11px] text-gray-400 transition hover:text-white"
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
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      requestedSessionId
                        ? `/editor/insights?sessionId=${encodeURIComponent(requestedSessionId)}`
                        : "/editor/insights"
                    )
                  }
                  className={`flex-1 rounded-lg px-3 py-2 text-sm transition ${
                    "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  Visualizer
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
