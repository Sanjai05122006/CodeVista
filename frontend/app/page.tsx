"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

export default function Home() {
  const [code, setCode] = useState("console.log(2+3)");
  const [language, setLanguage] = useState("javascript");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCode = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("http://localhost:5000/api/execution", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, language }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(
          data?.error?.message ||
            "⚠️ Unable to run code. Please try again."
        );
        setResult(null);
        return;
      }

      setResult(data);
    } catch (err) {
      setError("🌐 Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#020617] text-white flex justify-center px-3 py-3">
      <div className="w-full max-w-[1400px] flex flex-col">
        
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
        <div className="flex-1 p-[12px] rounded-2xl bg-[#0b1220]/60 border border-white/10 backdrop-blur-xl">
          <div className="h-full rounded-xl overflow-hidden border border-white/5 flex flex-col lg:flex-row">
            
            {/* LEFT - EDITOR */}
            <div className="lg:w-[70%] flex flex-col bg-[#0f172a]">
              
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
              <div className="flex-1">
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
            <div className="lg:w-[30%] flex flex-col bg-[#0b1220] p-4 gap-4">
              
              {/* ERROR MESSAGE */}
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
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

              {/* CONSOLE */}
              <div className="flex-1 flex flex-col">
                
                {/* HEADER */}
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

                {/* CONSOLE BOX */}
                <div className="flex-1 rounded-xl bg-[#020617] border border-white/10 p-4 font-mono text-sm overflow-auto">
                  
                  {/* SYSTEM ERROR */}
                  {result?.error ? (
                    <div className="text-yellow-400 whitespace-pre-wrap">
                      ⚠️ {result.error.message}
                    </div>

                  ) : result?.stderr ? (
                    
                    /* CODE ERROR */
                    <div className="text-red-400 whitespace-pre-wrap">
                      ❌ Error:
                      {"\n"}
                      {result.stderr}
                    </div>

                  ) : result?.stdout ? (
                    
                    /* SUCCESS OUTPUT */
                    <div className="text-gray-200 whitespace-pre-wrap">
                      {result.stdout}
                    </div>

                  ) : (
                    
                    /* EMPTY */
                    <div className="text-gray-500">
                      Run your code to see output...
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}