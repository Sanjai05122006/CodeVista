"use client";

import { useDeferredValue, useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  buildExecutionFlow,
  type FlowNodeData,
  type TraceStep,
} from "@/lib/trace-visualizer";
import { TraceNode } from "./trace-node";

type ExecutionFlowProps = {
  traceSteps: TraceStep[];
  activeIndex: number;
};

const nodeTypes = {
  trace: TraceNode,
};

function ActiveTraceViewport({
  nodes,
  activeIndex,
}: {
  nodes: Array<{
    id: string;
    position: { x: number; y: number };
    width?: number | null;
    height?: number | null;
  }>;
  activeIndex: number;
}) {
  const { setCenter } = useReactFlow<FlowNodeData>();

  useEffect(() => {
    const activeNode = nodes[activeIndex];
    if (!activeNode) {
      return;
    }

    const nodeWidth = activeNode.width ?? 240;
    const nodeHeight = activeNode.height ?? 120;

    void setCenter(
      activeNode.position.x + nodeWidth / 2,
      activeNode.position.y + nodeHeight / 2,
      {
        zoom: 0.8,
        duration: 350,
      }
    );
  }, [activeIndex, nodes, setCenter]);

  return null;
}

export function ExecutionFlow({
  traceSteps,
  activeIndex,
}: ExecutionFlowProps) {
  const deferredTrace = useDeferredValue(traceSteps);
  const { nodes, edges } = useMemo(
    () => buildExecutionFlow(deferredTrace, activeIndex),
    [activeIndex, deferredTrace]
  );

  if (traceSteps.length === 0) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0b1220] text-sm text-gray-500">
        Run JavaScript code to generate an execution graph.
      </div>
    );
  }

  return (
    <div className="h-full min-h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-[#07101f]">
      <ReactFlow
        fitView
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
        fitViewOptions={{ padding: 0.18, minZoom: 0.45 }}
        defaultEdgeOptions={{ type: "smoothstep" }}
      >
        <ActiveTraceViewport nodes={nodes} activeIndex={activeIndex} />
        <Controls
          showInteractive={false}
          style={{
            background: "rgba(15, 23, 42, 0.92)",
            border: "1px solid rgba(148, 163, 184, 0.12)",
          }}
        />
        <Background gap={24} size={1.2} color="rgba(148, 163, 184, 0.16)" />
      </ReactFlow>
    </div>
  );
}
