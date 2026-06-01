"use client";

import { StatusCard } from "@/components/ui/StatusCard";

type AnalysisData = {
  pseudocode: string[];
  algorithm_steps: string[];
  time_complexity: {
    best: string;
    average: string;
    worst: string;
  };
  space_complexity: string;
};

type AnalysisPanelProps = {
  analysis: AnalysisData | null;
  loading: boolean;
  error: string | null;
};

export default function AnalysisPanel({
  analysis,
  loading,
  error,
}: AnalysisPanelProps) {
  if (loading) {
    return (
      <StatusCard
        variant="dark"
        tone="loading"
        className="flex-1"
        title="Generating deterministic analysis..."
        message="Working through the code to produce structured output."
      />
    );
  }

  if (error) {
    return (
      <StatusCard
        variant="dark"
        tone="error"
        className="flex-1"
        title="Analysis unavailable"
        message={error}
      />
    );
  }

  if (!analysis) {
    return (
      <StatusCard
        variant="dark"
        tone="neutral"
        className="flex-1"
        title="No analysis yet"
        message="Run your code to generate algorithm analysis."
      />
    );
  }

  return (
    <div className="flex-1 rounded-xl bg-[#020617] border border-white/10 p-4 overflow-auto">
      <div className="space-y-4 text-sm">
        <section>
          <h4 className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-2">
            Pseudocode
          </h4>
          <div className="rounded-lg border border-white/10 bg-[#0b1220] p-3 font-mono text-xs text-green-300">
            {analysis.pseudocode.length > 0 ? (
              analysis.pseudocode.map((line, index) => (
                <div key={`${line}-${index}`} className="whitespace-pre-wrap">
                  {line}
                </div>
              ))
            ) : (
              <div>--</div>
            )}
          </div>
        </section>

        <section>
          <h4 className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-2">
            Algorithm
          </h4>
          <div className="rounded-lg border border-white/10 bg-[#0b1220] p-3 font-mono text-xs text-sky-300">
            {analysis.algorithm_steps.length > 0 ? (
              analysis.algorithm_steps.map((line, index) => (
                <div key={`${line}-${index}`} className="whitespace-pre-wrap">
                  {line}
                </div>
              ))
            ) : (
              <div>--</div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-white/10 bg-[#0b1220] p-3">
            <p className="text-xs text-gray-500 mb-1">Best Case</p>
            <p className="text-amber-300 font-medium">
              {analysis.time_complexity.best}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#0b1220] p-3">
            <p className="text-xs text-gray-500 mb-1">Average Case</p>
            <p className="text-orange-300 font-medium">
              {analysis.time_complexity.average}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#0b1220] p-3">
            <p className="text-xs text-gray-500 mb-1">Worst Case</p>
            <p className="text-rose-300 font-medium">
              {analysis.time_complexity.worst}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#0b1220] p-3">
            <p className="text-xs text-gray-500 mb-1">Space Complexity</p>
            <p className="text-cyan-300 font-medium">
              {analysis.space_complexity}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
