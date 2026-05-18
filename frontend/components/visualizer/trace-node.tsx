"use client";

import { Handle, Position, type NodeProps } from "reactflow";
import type { FlowNodeData } from "@/lib/trace-visualizer";

export function TraceNode({ data }: NodeProps<FlowNodeData>) {
  return (
    <div className="relative overflow-hidden rounded-[18px]">
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-0 !bg-indigo-300/80"
      />
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-xs text-indigo-200">
            Step {data.step}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-200">
            {data.eventLabel}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-white">{data.lineLabel}</div>
          <div className="text-[11px] text-slate-400">
            Depth {data.stackDepth}
          </div>
        </div>
      </div>
      <div className="px-4 py-3">
        <p className="text-xs leading-5 text-slate-300">{data.summary}</p>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-0 !bg-indigo-300/80"
      />
    </div>
  );
}
