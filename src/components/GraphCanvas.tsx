"use client";

import { ReactFlow, Controls, MiniMap, type Edge, type Node } from "@xyflow/react";
import { useMemo, useState } from "react";
import type { C4Element, C4Relationship, C4View } from "@/types/c4";
import { iconFor, toFlow } from "@/lib/view-model";
import { ElementDetail, RelationshipDetail } from "./DetailPanel";
import { LifecycleBadge } from "./LifecycleBadge";

function NodeCard({ element }: { element: C4Element }) {
  const Icon = iconFor(element);
  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-400/10 text-sky-300">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-100">{element.name}</div>
          <div className="mt-1 truncate text-xs text-slate-500">{element.technology ?? element.type}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <LifecycleBadge lifecycle={element.lifecycle} />
        {element.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">{tag}</span>
        ))}
      </div>
    </div>
  );
}

const nodeTypes = {
  default: ({ data }: { data: { element: C4Element } }) => <NodeCard element={data.element} />,
};

export function GraphCanvas({ view }: { view: C4View }) {
  const { nodes, edges } = useMemo(() => toFlow(view), [view]);
  const [selectedElement, setSelectedElement] = useState<C4Element | null>(view.elements[0] ?? null);
  const [selectedRelationship, setSelectedRelationship] = useState<C4Relationship | null>(null);

  function onNodeClick(_: unknown, node: Node) {
    setSelectedRelationship(null);
    setSelectedElement((node.data as { element: C4Element }).element);
  }

  function onEdgeClick(_: unknown, edge: Edge) {
    setSelectedElement(null);
    setSelectedRelationship((edge.data as { relationship: C4Relationship }).relationship);
  }

  return (
    <div className="grid h-[calc(100vh-73px)] grid-cols-[1fr_360px]">
      <section className="relative">
        <div className="absolute left-6 top-6 z-10 rounded-2xl border border-white/10 bg-slate-950/70 p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <LifecycleBadge lifecycle={view.lifecycle} />
            <span className="text-sm text-slate-400">{view.elements.length} elements · {view.relationships.length} links</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">{view.title}</h1>
        </div>
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodeClick={onNodeClick} onEdgeClick={onEdgeClick} fitView>
          <MiniMap pannable zoomable />
          <Controls />
        </ReactFlow>
      </section>
      {selectedRelationship ? (
        <RelationshipDetail relationship={selectedRelationship} />
      ) : selectedElement ? (
        <ElementDetail element={selectedElement} />
      ) : (
        <aside className="border-l border-white/10 bg-slate-950/70 p-5 text-sm text-slate-500">Select an element or relationship.</aside>
      )}
    </div>
  );
}
