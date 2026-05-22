import { Background, type Edge, MarkerType, type Node } from "@xyflow/react";
import { Database, Server, UserRound, Workflow } from "lucide-react";
import type { ComponentType } from "react";
import type { C4Element, C4Lifecycle, C4Relationship, C4View } from "@/types/c4";

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
  return Server;
}

export function toFlow(view: C4View): { nodes: Node[]; edges: Edge[] } {
  const nodes = view.elements.map((element, index) => ({
    id: element.id,
    type: "default",
    position: { x: 80 + (index % 3) * 300, y: 80 + Math.floor(index / 3) * 180 },
    data: { element },
    className: "c4-node",
  }));

  const edges = view.relationships.map((relationship: C4Relationship) => ({
    id: relationship.id,
    source: relationship.sourceId,
    target: relationship.targetId,
    label: relationship.protocol ?? relationship.technology ?? relationship.description,
    markerEnd: { type: MarkerType.ArrowClosed },
    className: relationship.lifecycle === "deprecated" ? "c4-edge-deprecated" : "c4-edge",
    data: { relationship },
  }));

  return { nodes, edges };
}

export { Background };
