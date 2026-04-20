"use client";

import { useState } from "react";

export default function Home() {
  const [code, setCode] = useState("console.log(2+3)");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const runCode = async () => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/execution", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, language }),
      });

      const data = await res.json();
      setOutput(data.stdout || data.stderr || "No output");
    } catch (err) {
      setOutput("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="title">CodeVista 🚀</h1>

      {/* Controls */}
      <div className="controls">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="select"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
        </select>

        <button onClick={runCode} className="runBtn">
          {loading ? "Running..." : "Run ▶"}
        </button>
      </div>

      {/* Code Editor */}
      <textarea
        rows={12}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="editor"
      />

      {/* Output */}
      <h3 className="outputTitle">Output:</h3>
      <pre className="outputBox">{output}</pre>
    </div>
  );
}