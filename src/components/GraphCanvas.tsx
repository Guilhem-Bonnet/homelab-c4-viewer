"use client";

import Link from "next/link";
import { ReactFlow, Controls, Handle, MiniMap, Panel, Position, type Edge, type Node, type ReactFlowInstance } from "@xyflow/react";
import clsx from "clsx";
import { Crosshair, Layers3, Maximize2, Minus, Plus, Search, Waypoints } from "lucide-react";
import { useMemo, useState } from "react";
import type { C4Element, C4Lifecycle, C4Relationship, C4View } from "@/types/c4";
import { Background, NODE_HEIGHT, NODE_WIDTH, iconFor, toFlow } from "@/lib/view-model";
import { ElementDetail, RelationshipDetail } from "./DetailPanel";
import { LifecycleBadge } from "./LifecycleBadge";

function NodeCard({ element }: { element: C4Element }) {
  const Icon = iconFor(element);
  const boundary = element.name.includes("/") ? element.name.split("/")[0] : element.canonicalId.split(".")[0];
  return (
    <div className="relative overflow-hidden p-4">
      <Handle type="target" position={Position.Left} className="c4-handle c4-handle-target" />
      <Handle type="source" position={Position.Right} className="c4-handle c4-handle-source" />
      <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-sky-400/10 blur-2xl" />
      <div className="flex items-start gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-sky-300/20 bg-sky-400/15 text-sky-200 shadow-lg shadow-sky-950/40">
          <Icon className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-100">{element.name}</div>
          <div className="mt-1 truncate text-xs text-slate-500">{element.technology ?? element.type}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {boundary ? (
          <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-200">
            {boundary}
          </span>
        ) : null}
        <LifecycleBadge lifecycle={element.lifecycle} />
        {element.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">{tag}</span>
        ))}
      </div>
    </div>
  );
}

function BoundaryCard({ data }: { data: { label: string; count: number } }) {
  return (
    <div className="c4-boundary-card">
      <span>{data.label}</span>
      <strong>{data.count}</strong>
    </div>
  );
}

const nodeTypes = {
  default: ({ data }: { data: { element: C4Element } }) => <NodeCard element={data.element} />,
  boundary: BoundaryCard,
};

const levelLabels: Record<C4View["level"], string> = {
  "system-landscape": "L1 Landscape",
  "system-context": "L2 Context",
  container: "L3 Containers",
  component: "L4 Components",
  deployment: "Deployment",
};

const lifecycleOptions: Array<C4Lifecycle | "all"> = ["all", "live", "normal", "test", "deprecated"];

function isBoundaryNode(node: Node): node is Node<{ childIds: string[]; label: string; count: number }> {
  return node.type === "boundary";
}

function matchesQuery(element: C4Element, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [
    element.name,
    element.description,
    element.technology,
    element.type,
    element.canonicalId,
    ...element.tags,
  ]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(needle));
}

export function GraphCanvas({
  view,
  allViews = [view],
  loadSource = "live",
}: {
  view: C4View;
  allViews?: C4View[];
  loadSource?: "live" | "fixture";
}) {
  const { nodes, edges } = useMemo(() => toFlow(view), [view]);
  const [selectedElement, setSelectedElement] = useState<C4Element | null>(view.elements[0] ?? null);
  const [selectedRelationship, setSelectedRelationship] = useState<C4Relationship | null>(null);
  const [query, setQuery] = useState("");
  const [lifecycleFilter, setLifecycleFilter] = useState<C4Lifecycle | "all">("all");
  const [flow, setFlow] = useState<ReactFlowInstance | null>(null);

  const filteredElements = useMemo(
    () =>
      view.elements.filter((element) =>
        lifecycleFilter === "all" ? true : element.lifecycle === lifecycleFilter,
      ),
    [lifecycleFilter, view.elements],
  );
  const visibleElementIds = useMemo(() => new Set(filteredElements.map((element) => element.id)), [filteredElements]);
  const queryMatches = useMemo(
    () => new Set(filteredElements.filter((element) => matchesQuery(element, query)).map((element) => element.id)),
    [filteredElements, query],
  );
  const impactElementIds = useMemo(() => {
    if (!selectedElement) return new Set<string>();
    return new Set([
      selectedElement.id,
      ...view.relationships
        .filter((relationship) => relationship.sourceId === selectedElement.id || relationship.targetId === selectedElement.id)
        .flatMap((relationship) => [relationship.sourceId, relationship.targetId]),
    ]);
  }, [selectedElement, view.relationships]);

  const visibleNodes = useMemo(
    () =>
      nodes
        .filter((node) =>
          isBoundaryNode(node)
            ? node.data.childIds.some((childId) => visibleElementIds.has(childId))
            : visibleElementIds.has(node.id),
        )
        .map((node) => ({
          ...node,
          className: isBoundaryNode(node)
            ? "c4-boundary"
            : clsx("c4-node", {
                "c4-node-dimmed": query.trim() && !queryMatches.has(node.id),
                "c4-node-match": query.trim() && queryMatches.has(node.id),
                "c4-node-impact": impactElementIds.has(node.id),
                "c4-node-selected": selectedElement?.id === node.id,
              }),
        })),
    [impactElementIds, nodes, query, queryMatches, selectedElement?.id, visibleElementIds],
  );
  const visibleEdges = useMemo(
    () =>
      edges
        .filter((edge) => visibleElementIds.has(edge.source) && visibleElementIds.has(edge.target))
        .map((edge) => {
          const relationship = (edge.data as { relationship: C4Relationship }).relationship;
          const isImpact =
            selectedElement &&
            (relationship.sourceId === selectedElement.id || relationship.targetId === selectedElement.id);
          return {
            ...edge,
            className: clsx(edge.className, { "c4-edge-impact": isImpact }),
            animated: Boolean(isImpact),
          };
        }),
    [edges, selectedElement, visibleElementIds],
  );
  const searchResults = useMemo(
    () => filteredElements.filter((element) => matchesQuery(element, query)).slice(0, 8),
    [filteredElements, query],
  );
  const levelViews = useMemo(
    () =>
      Object.entries(levelLabels)
        .map(([level, label]) => ({
          level: level as C4View["level"],
          label,
          view: allViews.find((candidate) => candidate.level === level),
        }))
        .filter((item) => item.level !== "component" || item.view),
    [allViews],
  );

  function focusElement(element: C4Element) {
    setSelectedRelationship(null);
    setSelectedElement(element);
    const node = flow?.getNode(element.id);
    if (node) {
      const width = node.measured?.width ?? node.width ?? NODE_WIDTH;
      const height = node.measured?.height ?? node.height ?? NODE_HEIGHT;
      flow?.setCenter(node.position.x + width / 2, node.position.y + height / 2, { zoom: 1.18, duration: 500 });
    }
  }

  function fitArchitecture() {
    flow?.fitView({ padding: 0.16, duration: 500 });
  }

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
        <div className="absolute left-6 top-6 z-10 w-[min(680px,calc(100%-48px))] rounded-2xl border border-white/10 bg-slate-950/75 p-4 shadow-2xl backdrop-blur">
          <div className="flex items-center gap-3">
            <LifecycleBadge lifecycle={view.lifecycle} />
            <span className="text-sm text-slate-400">{levelLabels[view.level]} · {view.elements.length} elements · {view.relationships.length} links</span>
            <span className={`ml-auto rounded-full border px-2 py-0.5 text-[11px] ${loadSource === "live" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-amber-400/30 bg-amber-400/10 text-amber-200"}`}>
              {loadSource === "live" ? "live" : "fixture"}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-100">{view.title}</h1>
          <div className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-slate-900/55 p-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-slate-100"
            >
              <Layers3 className="h-3.5 w-3.5" />
              Overview
            </Link>
            {levelViews.map((item) =>
              item.view ? (
                <Link
                  key={item.level}
                  href={`/views/${item.view.key}`}
                  className={clsx(
                    "rounded-xl px-3 py-1.5 text-xs font-medium transition",
                    item.level === view.level
                      ? "bg-sky-400/15 text-sky-100 ring-1 ring-sky-300/30"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <span key={item.level} className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700">
                  {item.label}
                </span>
              ),
            )}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_150px]">
            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-400">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search service, tag, technology..."
                className="w-full bg-transparent text-slate-100 outline-none placeholder:text-slate-600"
              />
            </label>
            <select
              value={lifecycleFilter}
              onChange={(event) => setLifecycleFilter(event.target.value as C4Lifecycle | "all")}
              className="rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 outline-none"
            >
              {lifecycleOptions.map((option) => (
                <option key={option} value={option}>{option === "all" ? "All lifecycles" : option}</option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {searchResults.map((element) => (
              <button
                key={element.id}
                type="button"
                onClick={() => focusElement(element)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300 hover:border-sky-400/40 hover:text-sky-100"
              >
                <Crosshair className="h-3 w-3" />
                {element.name}
              </button>
            ))}
          </div>
          {view.relationships.length === 0 ? (
            <p className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
              No relationships in this Structurizr view yet; switch to a richer level or add relationship metadata in the DSL.
            </p>
          ) : null}
        </div>
        <ReactFlow
          nodes={visibleNodes}
          edges={visibleEdges}
          nodeTypes={nodeTypes}
          onInit={setFlow}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          fitView
          minZoom={0.08}
          maxZoom={1.8}
        >
          <Background gap={28} size={1.2} color="rgba(148, 163, 184, 0.13)" />
          <Panel position="top-right" className="rounded-2xl border border-white/10 bg-slate-950/75 p-2 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => flow?.zoomOut({ duration: 300 })} className="c4-tool-button" aria-label="Zoom out">
                <Minus className="h-4 w-4" />
              </button>
              <button type="button" onClick={fitArchitecture} className="c4-tool-button min-w-16" aria-label="Fit architecture">
                <Maximize2 className="h-4 w-4" />
                Fit
              </button>
              <button type="button" onClick={() => flow?.zoomIn({ duration: 300 })} className="c4-tool-button" aria-label="Zoom in">
                <Plus className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => selectedElement && focusElement(selectedElement)} className="c4-tool-button min-w-20" aria-label="Focus selected element">
                <Waypoints className="h-4 w-4" />
                Focus
              </button>
            </div>
          </Panel>
          <MiniMap pannable zoomable nodeStrokeWidth={3} />
          <Controls showInteractive={false} />
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
