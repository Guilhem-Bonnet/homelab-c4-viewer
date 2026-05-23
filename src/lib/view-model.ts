import dagre from "@dagrejs/dagre";
import { Background, MarkerType, Position, type Edge, type Node } from "@xyflow/react";
import { Bot, Cloud, Database, GitBranch, HardDrive, KeyRound, Network, Server, Shield, UserRound, Workflow } from "lucide-react";
import type { ComponentType } from "react";
import type { C4Element, C4Lifecycle, C4Relationship, C4View } from "@/types/c4";
import { flowColor, flowKind } from "./visual-style";

export function lifecycleClass(lifecycle: C4Lifecycle): string {
  switch (lifecycle) {
    case "live":
      return "border-emerald-400/40 bg-emerald-400/10 text-emerald-200";
    case "test":
      return "border-violet-400/40 bg-violet-400/10 text-violet-200";
    case "deprecated":
      return "border-slate-500/40 bg-slate-500/10 text-slate-400";
    default:
      return "border-sky-400/40 bg-sky-400/10 text-sky-200";
  }
}

export function iconFor(element: C4Element): ComponentType<{ className?: string }> {
  if (element.tags.includes("Person")) return UserRound;
  if (element.tags.includes("Database")) return Database;
  if (element.tags.includes("Queue")) return Workflow;
  if (element.name.toLowerCase().includes("aws") || element.tags.includes("AWS")) return Cloud;
  if (element.name.toLowerCase().includes("git") || element.name.toLowerCase().includes("flux")) return GitBranch;
  if (element.name.toLowerCase().includes("nfs") || element.name.toLowerCase().includes("longhorn")) return HardDrive;
  if (element.name.toLowerCase().includes("auth") || element.name.toLowerCase().includes("sso")) return KeyRound;
  if (element.name.toLowerCase().includes("traefik") || element.name.toLowerCase().includes("dns")) return Network;
  if (element.name.toLowerCase().includes("kyverno") || element.name.toLowerCase().includes("trivy")) return Shield;
  if (element.name.toLowerCase().includes("ollama") || element.name.toLowerCase().includes("ai")) return Bot;
  return Server;
}

export const NODE_WIDTH = 270;
export const NODE_HEIGHT = 148;
const GRID_COLUMNS = 4;
const BOUNDARY_PADDING_X = 52;
const BOUNDARY_PADDING_TOP = 58;
const BOUNDARY_PADDING_BOTTOM = 42;

function boundaryLabel(element: C4Element): string {
  if (element.name.includes("/")) return element.name.split("/")[0] ?? "core";
  if (element.type.toLowerCase().includes("person")) return "people";
  if (element.tags.includes("external")) return "external";
  return element.canonicalId.split(".")[0] ?? "core";
}

function addBoundaryNodes(nodes: Node[], view: C4View): Node[] {
  const elementById = new Map(view.elements.map((element) => [element.id, element]));
  const grouped = new Map<string, Node[]>();

  nodes.forEach((node) => {
    const element = elementById.get(node.id);
    if (!element) return;
    const label = boundaryLabel(element);
    grouped.set(label, [...(grouped.get(label) ?? []), node]);
  });

  const boundaryNodes = Array.from(grouped.entries())
    .filter(([, groupNodes]) => groupNodes.length >= 2)
    .map(([label, groupNodes]) => {
      const minX = Math.min(...groupNodes.map((node) => node.position.x));
      const minY = Math.min(...groupNodes.map((node) => node.position.y));
      const maxX = Math.max(...groupNodes.map((node) => node.position.x + NODE_WIDTH));
      const maxY = Math.max(...groupNodes.map((node) => node.position.y + NODE_HEIGHT));

      return {
        id: `boundary:${label}`,
        type: "boundary",
        position: {
          x: minX - BOUNDARY_PADDING_X,
          y: minY - BOUNDARY_PADDING_TOP,
        },
        data: {
          label,
          childIds: groupNodes.map((node) => node.id),
          count: groupNodes.length,
        },
        style: {
          width: maxX - minX + BOUNDARY_PADDING_X * 2,
          height: maxY - minY + BOUNDARY_PADDING_TOP + BOUNDARY_PADDING_BOTTOM,
        },
        selectable: false,
        draggable: false,
        focusable: false,
        zIndex: -1,
      } satisfies Node;
    });

  return [
    ...boundaryNodes,
    ...nodes.map((node) => ({ ...node, zIndex: 1 })),
  ];
}

function layoutNodes(view: C4View, edges: Edge[]): Node[] {
  if (view.relationships.length === 0) {
    return addBoundaryNodes(view.elements.map((element, index) => ({
      id: element.id,
      type: "default",
      position: { x: 80 + (index % GRID_COLUMNS) * 330, y: 90 + Math.floor(index / GRID_COLUMNS) * 210 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: { element },
      className: "c4-node",
    })), view);
  }

  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: "LR",
    nodesep: view.elements.length > 40 ? 116 : 104,
    ranksep: view.elements.length > 40 ? 210 : 250,
    edgesep: 52,
    marginx: 80,
    marginy: 120,
  });

  view.elements.forEach((element) => graph.setNode(element.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((edge) => graph.setEdge(edge.source, edge.target));
  dagre.layout(graph);

  const laidOutNodes = view.elements.map((element) => {
    const node = graph.node(element.id);
    return {
      id: element.id,
      type: "default",
      position: {
        x: (node?.x ?? 0) - NODE_WIDTH / 2,
        y: (node?.y ?? 0) - NODE_HEIGHT / 2,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: { element },
      className: "c4-node",
    };
  });

  return addBoundaryNodes(laidOutNodes, view);
}

export function toFlow(view: C4View): { nodes: Node[]; edges: Edge[] } {
  const flowLaneOffsets = {
    user: -46,
    network: -30,
    security: -18,
    service: 0,
    storage: 24,
    observability: 42,
    gitops: 58,
    backup: 74,
  } satisfies Record<ReturnType<typeof flowKind>, number>;
  const relationshipGroups = new Map<string, C4Relationship[]>();
  view.relationships.forEach((relationship) => {
    const forward = `${relationship.sourceId}->${relationship.targetId}`;
    const reverse = `${relationship.targetId}->${relationship.sourceId}`;
    const key = forward < reverse ? forward : reverse;
    relationshipGroups.set(key, [...(relationshipGroups.get(key) ?? []), relationship]);
  });

  const edges = view.relationships.map((relationship: C4Relationship) => {
    const forward = `${relationship.sourceId}->${relationship.targetId}`;
    const reverse = `${relationship.targetId}->${relationship.sourceId}`;
    const key = forward < reverse ? forward : reverse;
    const group = relationshipGroups.get(key) ?? [relationship];
    const groupIndex = group.findIndex((candidate) => candidate.id === relationship.id);
    const kind = flowKind(relationship);
    const laneOffset = (groupIndex - (group.length - 1) / 2) * 34 + flowLaneOffsets[kind];

    return {
      id: relationship.id,
      source: relationship.sourceId,
      target: relationship.targetId,
      label: relationship.protocol ?? relationship.technology ?? relationship.description,
      type: "architecture",
      markerEnd: { type: MarkerType.ArrowClosed },
      className: relationship.lifecycle === "deprecated" ? "c4-edge-deprecated" : `c4-edge c4-edge-flow-${kind}`,
      style: { stroke: flowColor(kind) },
      labelBgPadding: [8, 4] as [number, number],
      labelBgBorderRadius: 8,
      labelStyle: { fill: "#dbeafe", fontWeight: 450, fontSize: 10.5, letterSpacing: 0.08 },
      labelBgStyle: { fill: "rgba(15, 23, 42, 0.72)", stroke: "rgba(125, 211, 252, 0.18)" },
      data: { relationship, laneOffset, flowKind: kind },
    };
  });
  const nodes = layoutNodes(view, edges);

  return { nodes, edges };
}

export { Background };
