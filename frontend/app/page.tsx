"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import AnalysisPanel from "./components/analysis-panel";

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

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function Home() {
  const [code, setCode] = useState("console.log(2+3)");
  const [language, setLanguage] = useState("javascript");
  const [result, setResult] = useState<any>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"output" | "analysis">("output");
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const runCode = async () => {
    try {
      setLoading(true);
      setAnalysisLoading(true);
      setExecutionError(null);
      setAnalysisError(null);
      setActiveTab("output");
      setAnalysis(null);

      const payload = JSON.stringify({ code, language });
      const headers = {
        "Content-Type": "application/json",
      };

      const [executionRes, analysisRes] = await Promise.all([
        fetch(`${API_BASE_URL}/execution`, {
          method: "POST",
          headers,
          body: payload,
        }),
        fetch(`${API_BASE_URL}/analysis`, {
          method: "POST",
          headers,
          body: payload,
        }),
      ]);

      const [executionData, analysisData] = await Promise.all([
        executionRes.json(),
        analysisRes.json(),
      ]);

      if (!executionRes.ok || executionData.error) {
        setExecutionError(
          executionData?.error?.message ||
            "⚠️ Unable to run code. Please try again."
        );
        setResult(null);
        return;
      }

      setResult(executionData);

      if (!analysisRes.ok || analysisData.error) {
        setAnalysisError(
          analysisData?.message ||
            "⚠️ Analysis is unavailable right now. Please try again."
        );
        return;
      }

      setAnalysis(analysisData);
    } catch (err) {
      setExecutionError("🌐 Network error. Please check your connection.");
    } finally {
      setLoading(false);
      setAnalysisLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex justify-center px-3 py-3">
      <div className="w-full max-w-[1400px] min-h-[calc(100vh-24px)] flex flex-col">
        
        {/* HEADER */}
        <div className="mb-3 flex items-center justify-between px-1">
          <div>
            <h1 className="text-lg font-semibold text-indigo-400">
              CodeVista
            </h1>
            <p className="text-[11px] text-gray-400">
              Interactive Code Workspace
            </p>
          </div>

          <span className="text-[10px] text-gray-500 uppercase">
            {language}
          </span>
        </div>

        {/* MAIN */}
        <div className="flex-1 min-h-0 p-[12px] rounded-2xl bg-[#0b1220]/60 border border-white/10 backdrop-blur-xl">
          <div className="h-full min-h-0 rounded-xl overflow-hidden border border-white/5 flex flex-col lg:flex-row">
            
            {/* LEFT - EDITOR */}
            <div className="lg:w-[70%] min-h-[420px] lg:min-h-0 flex flex-col bg-[#0f172a]">
              
              {/* CONTROLS */}
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

              {/* EDITOR */}
              <div className="flex-1 min-h-[320px] lg:min-h-0">
                <Editor
                  height="100%"
                  language={language}
                  value={code}
                  theme="vs-dark"
                  onChange={(v) => setCode(v || "")}
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    smoothScrolling: true,
                  }}
                />
              </div>
            </div>

            {/* RIGHT - OUTPUT */}
            <div className="lg:w-[30%] min-h-[380px] lg:min-h-0 flex flex-col bg-[#0b1220] p-4 gap-4">
              
              {/* ERROR MESSAGE */}
              {executionError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {executionError}
                </div>
              )}

              {/* PERFORMANCE */}
              <div>
                <h3 className="text-sm text-gray-300 mb-3">
                  Performance
                </h3>

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

              {/* CONSOLE */}
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
      </div>
    </div>
  );
}
