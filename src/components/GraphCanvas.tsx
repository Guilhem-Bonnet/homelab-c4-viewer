"use client";

import Link from "next/link";
import {
  ReactFlow,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MiniMap,
  Panel,
  Position,
  type Edge,
  type EdgeProps,
  type Node,
  type ReactFlowInstance,
} from "@xyflow/react";
import clsx from "clsx";
import { Crosshair, Layers3, Maximize2, Minus, Plus, Search, Waypoints } from "lucide-react";
import { useCallback, useDeferredValue, useMemo, useState, useTransition } from "react";
import type { CSSProperties } from "react";
import type { C4Element, C4Lifecycle, C4Relationship, C4View } from "@/types/c4";
import { Background, NODE_HEIGHT, NODE_WIDTH, iconFor, toFlow } from "@/lib/view-model";
import { simpleIconPath } from "@/lib/app-icons";
import { flowColor, healthLabel, healthState, nodeRole, zoneColor, zoneKey, type FlowKind, type HealthState, type NodeRole } from "@/lib/visual-style";
import { ElementDetail, RelationshipDetail } from "./DetailPanel";
import { LifecycleBadge } from "./LifecycleBadge";

type DensityMode = "compact" | "normal" | "detail";
type LabelMode = "focus" | "hover" | "always";
type EdgeRoutingMode = "auto" | "orthogonal" | "straight" | "smooth";
type LayerId = "apps" | "storage" | "security" | "observability" | "external";

function HealthDot({ state }: { state: HealthState }) {
  return <span className={`c4-health-dot c4-health-${state}`} title={healthLabel(state)} />;
}

function NodeCard({ element, density }: { element: C4Element; density: DensityMode }) {
  const Icon = iconFor(element);
  const logoPath = element.icon ? simpleIconPath(element.icon.slug) : undefined;
  const boundary = element.name.includes("/") ? element.name.split("/")[0] : element.canonicalId.split(".")[0];
  const role = nodeRole(element);
  const health = healthState(element);
  const accent = zoneColor(element);
  // Filter out Structurizr system tags — they add noise with no user value
  const systemTags = new Set(["Element", "Container", "Component", "Software System", "Person", "Database", "Queue", "Relationship"]);
  const customTags = element.tags.filter((tag) => !systemTags.has(tag));
  return (
    <div className="relative overflow-hidden p-4" style={{ "--c4-accent": accent } as CSSProperties}>
      <Handle type="target" position={Position.Left} className="c4-handle c4-handle-target" />
      <Handle type="source" position={Position.Right} className="c4-handle c4-handle-source" />
      {/* very subtle ambient glow — reduced opacity vs previous 0x22 */}
      <div className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full blur-2xl" style={{ background: `${accent}14` }} />
      <div className="flex items-start gap-3">
        <div className={`c4-node-icon c4-node-icon-${role}`}>
          {logoPath ? (
            <svg viewBox="0 0 24 24" className="h-7 w-7" aria-label={element.icon?.title} role="img">
              <path fill="currentColor" d={logoPath} />
            </svg>
          ) : (
            <Icon className="h-7 w-7" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <div className="truncate text-sm font-semibold text-slate-100">{element.name}</div>
            <HealthDot state={health} />
          </div>
          {density !== "compact" ? <div className="mt-1 truncate text-xs text-slate-500">{element.technology ?? element.type}</div> : null}
        </div>
      </div>
      <div className={clsx("mt-4 flex flex-wrap gap-1.5", density === "compact" && "hidden")}>
        {/* zone badge: always show in normal/detail */}
        {boundary ? (
          <span className="rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: `${accent}36`, background: `${accent}10`, color: accent }}>
            {boundary}
          </span>
        ) : null}
        {/* lifecycle badge: only show for non-live states (LIVE is the default/noisy) */}
        {(element.lifecycle !== "live" || density === "detail") ? <LifecycleBadge lifecycle={element.lifecycle} /> : null}
        {/* custom tags only — filtered system tags */}
        {customTags.slice(0, density === "detail" ? 4 : 0).map((tag) => (
          <span key={tag} className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-400">{tag}</span>
        ))}
      </div>
      {density === "detail" && element.app ? (
        <div className="mt-3 grid grid-cols-3 gap-1.5 text-[10px] text-slate-500">
          <span>{element.app.containers.length} ctr</span>
          <span>{element.app.services.length} svc</span>
          <span>{element.app.volumes.length} vol</span>
        </div>
      ) : null}
    </div>
  );
}

function BoundaryCard({ data }: { data: { label: string; count: number } }) {
  const accent = zoneColor(data.label);
  return (
    <div className="c4-boundary-card" style={{ "--c4-accent": accent } as CSSProperties}>
      <span>{data.label}</span>
      <strong>{data.count}</strong>
    </div>
  );
}

const nodeTypes = {
  default: ({ data }: { data: { element: C4Element; density?: DensityMode } }) => <NodeCard element={data.element} density={data.density ?? "normal"} />,
  boundary: BoundaryCard,
};

type ArchitectureEdgeData = {
  relationship: C4Relationship;
  laneOffset?: number;
  flowKind?: FlowKind;
  isImpact?: boolean;
  labelMode?: LabelMode;
  isFocusConnected?: boolean;
  routing?: Exclude<EdgeRoutingMode, "auto">;
};

function ArchitectureEdge(props: EdgeProps<Edge<ArchitectureEdgeData>>) {
  const laneOffset = props.data?.laneOffset ?? 0;
  const kind = props.data?.flowKind ?? "service";
  const color = flowColor(kind);
  const routing = props.data?.routing ?? "orthogonal";
  const midX = (props.sourceX + props.targetX) / 2;
  const midY = (props.sourceY + props.targetY) / 2 + laneOffset;
  const path = (() => {
    if (routing === "straight") {
      return `M ${props.sourceX},${props.sourceY} L ${props.targetX},${props.targetY}`;
    }
    if (routing === "smooth") {
      const dx = Math.max(96, Math.abs(props.targetX - props.sourceX) * 0.42);
      return `M ${props.sourceX},${props.sourceY} C ${props.sourceX + dx},${props.sourceY + laneOffset} ${props.targetX - dx},${props.targetY + laneOffset} ${props.targetX},${props.targetY}`;
    }
    return `M ${props.sourceX},${props.sourceY} L ${midX},${props.sourceY} L ${midX},${props.targetY + laneOffset} L ${props.targetX},${props.targetY}`;
  })();
  const labelX = (props.sourceX + props.targetX) / 2;
  const labelY = midY;
  const label = props.label ?? props.data?.relationship.description;
  const showLabel =
    props.data?.labelMode === "always" ||
    (props.data?.labelMode === "hover" && props.data?.isFocusConnected) ||
    props.data?.isImpact;

  return (
    <>
      <BaseEdge
        id={props.id}
        path={path}
        markerEnd={props.markerEnd}
        className={clsx(
          props.data?.relationship.lifecycle === "deprecated" ? "c4-edge-deprecated" : "c4-edge",
          `c4-edge-flow-${kind}`,
          { "c4-edge-impact": props.data?.isImpact },
        )}
        style={{ ...props.style, stroke: color }}
        interactionWidth={24}
      />
      {label ? (
        <EdgeLabelRenderer>
          <div
            className={clsx("c4-edge-label", {
              "c4-edge-label-visible": showLabel,
              "c4-edge-label-hover": props.data?.labelMode === "hover",
            })}
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, "--c4-accent": color } as CSSProperties}
          >
            {String(label)}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

const edgeTypes = {
  architecture: ArchitectureEdge,
};

const levelLabels: Record<C4View["level"], string> = {
  "system-landscape": "L1 Landscape",
  "system-context": "L2 Context",
  container: "L3 Containers",
  component: "L4 Components",
  deployment: "Deployment",
};

const lifecycleOptions: Array<C4Lifecycle | "all"> = ["all", "live", "normal", "test", "deprecated"];
const flowOptions = [
  { id: "all", label: "All flows" },
  { id: "critical", label: "Critical" },
  { id: "user-flow", label: "User" },
  { id: "storage-flow", label: "Storage" },
  { id: "security-flow", label: "Security" },
  { id: "observability-flow", label: "Observability" },
] as const;
type FlowFilter = (typeof flowOptions)[number]["id"];
const layerOptions: Array<{ id: LayerId; label: string; roles: NodeRole[] }> = [
  { id: "apps", label: "Apps", roles: ["app", "gateway", "database"] },
  { id: "storage", label: "Storage", roles: ["storage"] },
  { id: "security", label: "Security", roles: ["security"] },
  { id: "observability", label: "Monitoring", roles: ["observability"] },
  { id: "external", label: "External/AWS", roles: ["external", "cloud"] },
];
const densityOptions: DensityMode[] = ["compact", "normal", "detail"];
const labelOptions: Array<{ id: LabelMode; label: string }> = [
  { id: "focus", label: "Labels on focus" },
  { id: "hover", label: "Labels subtle" },
  { id: "always", label: "Labels always" },
];
const routingOptions: Array<{ id: EdgeRoutingMode; label: string }> = [
  { id: "auto", label: "Routing auto" },
  { id: "orthogonal", label: "Angles" },
  { id: "straight", label: "Straight" },
  { id: "smooth", label: "Curves" },
];

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
  loadError,
  generatedAt,
}: {
  view: C4View;
  allViews?: C4View[];
  loadSource?: "live" | "fixture";
  loadError?: string;
  generatedAt?: string;
}) {
  const { nodes, edges } = useMemo(() => toFlow(view), [view]);
  const [selectedElement, setSelectedElement] = useState<C4Element | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<C4Relationship | null>(null);
  const [query, setQuery] = useState("");
  const [lifecycleFilter, setLifecycleFilter] = useState<C4Lifecycle | "all">("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [flowFilter, setFlowFilter] = useState<FlowFilter>("all");
  const [density, setDensity] = useState<DensityMode>("normal");
  const [labelMode, setLabelMode] = useState<LabelMode>("focus");
  const [routingMode, setRoutingMode] = useState<EdgeRoutingMode>("auto");
  const [activeLayers, setActiveLayers] = useState<Record<LayerId, boolean>>({
    apps: true,
    storage: true,
    security: true,
    observability: true,
    external: true,
  });
  const [flow, setFlow] = useState<ReactFlowInstance | null>(null);
  const [, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);
  const isDenseView = view.elements.length > 42 || view.relationships.length > 70;
  const effectiveRouting: Exclude<EdgeRoutingMode, "auto"> = routingMode === "auto"
    ? isDenseView ? "orthogonal" : "smooth"
    : routingMode;
  const focusNeighborIds = useMemo((): Set<string> | null => {
    if (selectedRelationship) return new Set([selectedRelationship.sourceId, selectedRelationship.targetId]);
    if (!selectedElement) return null;
    return new Set([
      selectedElement.id,
      ...view.relationships
        .filter((r) => r.sourceId === selectedElement.id || r.targetId === selectedElement.id)
        .flatMap((r) => [r.sourceId, r.targetId]),
    ]);
  }, [selectedElement, selectedRelationship, view.relationships]);
  const zoneOptions = useMemo(
    () => ["all", ...Array.from(new Set(view.elements.map((element) => element.zone ?? "core"))).sort()],
    [view.elements],
  );

  const filteredElements = useMemo(
    () =>
      view.elements.filter((element) => {
        const role = nodeRole(element);
        const layer = layerOptions.find((option) => option.roles.includes(role))?.id ?? "apps";
        return (
          (lifecycleFilter === "all" ? true : element.lifecycle === lifecycleFilter) &&
          (zoneFilter === "all" ? true : (element.zone ?? "core") === zoneFilter) &&
          activeLayers[layer]
        );
      }),
    [activeLayers, lifecycleFilter, view.elements, zoneFilter],
  );
  const visibleElementIds = useMemo(() => new Set(filteredElements.map((element) => element.id)), [filteredElements]);
  const queryMatches = useMemo(
    () => new Set(filteredElements.filter((element) => matchesQuery(element, deferredQuery)).map((element) => element.id)),
    [filteredElements, deferredQuery],
  );

  const visibleNodes = useMemo(
    () =>
      nodes
        .filter((node) =>
          isBoundaryNode(node)
            ? node.data.childIds.some((childId) => visibleElementIds.has(childId))
            : visibleElementIds.has(node.id),
        )
        .map((node) => {
          if (isBoundaryNode(node)) {
            const accent = zoneColor(node.data.label);
            return { ...node, data: node.data, className: "c4-boundary", style: { ...node.style, "--c4-accent": accent } as CSSProperties };
          }
          const element = (node.data as { element: C4Element }).element;
          const accent = zoneColor(element);
          return {
            ...node,
            data: { ...node.data, density },
            style: { ...node.style, "--c4-accent": accent } as CSSProperties,
            className: clsx("c4-node", `c4-role-${nodeRole(element)}`, `c4-zone-${zoneKey(element)}`, `c4-health-${healthState(element)}`, {
              "c4-node-dimmed": deferredQuery.trim() && !queryMatches.has(node.id),
              "c4-node-match": deferredQuery.trim() && queryMatches.has(node.id),
              "c4-node-impact": focusNeighborIds !== null && focusNeighborIds.has(node.id),
              "c4-node-selected": selectedElement?.id === node.id,
              "c4-node-focus-dim": focusNeighborIds !== null && !focusNeighborIds.has(node.id),
            }),
          };
        }),
    [density, deferredQuery, focusNeighborIds, nodes, queryMatches, selectedElement?.id, visibleElementIds],
  );
  const visibleEdges = useMemo(
    () =>
      edges
        .filter((edge) => visibleElementIds.has(edge.source) && visibleElementIds.has(edge.target))
        .filter((edge) => {
          const relationship = (edge.data as { relationship: C4Relationship }).relationship;
          if (flowFilter === "all") return true;
          if (flowFilter === "critical") {
            return relationship.tags.some((tag) =>
              ["user-flow", "security-flow", "storage-flow", "gitops-flow", "backup-flow"].includes(tag),
            );
          }
          return relationship.tags.includes(flowFilter);
        })
        .map((edge) => {
          const relationship = (edge.data as { relationship: C4Relationship }).relationship;
          const isElementImpact =
            selectedElement !== null &&
            (relationship.sourceId === selectedElement.id || relationship.targetId === selectedElement.id);
          const isRelationshipImpact = selectedRelationship?.id === relationship.id;
          const isImpact = isElementImpact || isRelationshipImpact;
          const hasFocus = selectedElement !== null || selectedRelationship !== null;
          return {
            ...edge,
            className: clsx(edge.className, {
              "c4-edge-impact": isImpact,
              "c4-edge-focus-dim": hasFocus && !isImpact,
              "c4-edge-focus-active": isImpact,
            }),
            animated: Boolean(isImpact) && !isDenseView,
            data: {
              ...(edge.data as ArchitectureEdgeData),
              isImpact: Boolean(isImpact),
              labelMode,
              isFocusConnected: Boolean(isImpact),
              routing: effectiveRouting,
            },
          };
        }),
    [edges, effectiveRouting, flowFilter, isDenseView, labelMode, selectedElement, selectedRelationship, visibleElementIds],
  );
  const searchResults = useMemo(
    () => filteredElements.filter((element) => matchesQuery(element, deferredQuery)).slice(0, 8),
    [filteredElements, deferredQuery],
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

  const focusElement = useCallback((element: C4Element) => {
    setSelectedRelationship(null);
    setSelectedElement(element);
    const node = flow?.getNode(element.id);
    if (node) {
      const width = node.measured?.width ?? node.width ?? NODE_WIDTH;
      const height = node.measured?.height ?? node.height ?? NODE_HEIGHT;
      flow?.setCenter(node.position.x + width / 2, node.position.y + height / 2, { zoom: 1.18, duration: 500 });
    }
  }, [flow]);

  const fitArchitecture = useCallback(() => {
    flow?.fitView({ padding: 0.16, duration: 500 });
  }, [flow]);

  const toggleLayer = useCallback((layer: LayerId) => {
    startTransition(() => setActiveLayers((current) => ({ ...current, [layer]: !current[layer] })));
  }, [startTransition]);

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    if (isBoundaryNode(node)) return;
    const element = (node.data as { element?: C4Element }).element;
    if (!element) return;
    setSelectedRelationship(null);
    setSelectedElement(element);
  }, []);

  const onEdgeClick = useCallback((_: unknown, edge: Edge) => {
    const relationship = (edge.data as { relationship?: C4Relationship } | undefined)?.relationship;
    if (!relationship) return;
    setSelectedElement(null);
    setSelectedRelationship(relationship);
  }, []);

  const clearFocus = useCallback(() => {
    setSelectedElement(null);
    setSelectedRelationship(null);
  }, []);

  return (
    <div className={clsx("grid h-[calc(100vh-73px)] grid-cols-[1fr_360px]", isDenseView && "c4-dense-view")}>
      <section className="relative">
        <div className="absolute left-6 top-6 z-10 max-h-[calc(100vh-150px)] w-[min(560px,calc(100%-48px))] overflow-auto rounded-2xl border border-white/10 bg-slate-950/82 p-4 shadow-2xl backdrop-blur">
          <div className="flex items-center gap-3">
            <LifecycleBadge lifecycle={view.lifecycle} />
            <span className="text-sm text-slate-400">
              {levelLabels[view.level]} · {visibleNodes.filter((node) => !isBoundaryNode(node)).length}/{view.elements.length} elements · {visibleEdges.length}/{view.relationships.length} links
            </span>
            <span className={`ml-auto rounded-full border px-2 py-0.5 text-[11px] ${loadSource === "live" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-amber-400/30 bg-amber-400/10 text-amber-200"}`}>
              {loadSource === "live" ? "live" : "fixture"}
            </span>
            {generatedAt && (
              <span
                className="rounded-full border border-slate-700/50 bg-slate-800/50 px-2 py-0.5 text-[11px] text-slate-400"
                title={`Généré le ${new Date(generatedAt).toLocaleString("fr-FR")} · Refresh toutes les heures via CronJob`}
              >
                {(() => {
                  const diff = Date.now() - new Date(generatedAt).getTime();
                  const mins = Math.round(diff / 60000);
                  if (mins < 2) return "just now";
                  if (mins < 60) return `${mins}min ago`;
                  const hrs = Math.round(mins / 60);
                  return `${hrs}h ago`;
                })()}
                {" · "}↻1h
              </span>
            )}
          </div>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-100">{view.title}</h1>
          <p className="mt-1 text-xs text-slate-500">
            Clic sur un élément = focus stable sur ses flux. Clic dans le vide = reset.
          </p>
          {loadSource === "fixture" ? (
            <p className="mt-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
              ⚠ Backend live injoignable — données d&apos;exemple affichées. Le graphe réel réapparaît dès que <code className="text-amber-200">c4.home/api</code> répond.
              {loadError ? <span className="mt-1 block text-amber-200/70">{loadError}</span> : null}
            </p>
          ) : null}
          {isDenseView ? (
            <p className="mt-2 rounded-xl border border-amber-400/15 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
              Dense mode actif: routing en angles, animations coupées, effets visuels allégés.
            </p>
          ) : null}
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/55 p-2">
            <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Navigation</div>
            <div className="flex flex-wrap gap-2">
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
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/45 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Recherche & filtres</div>
                <p className="mt-1 text-xs text-slate-500">Réduis le graphe avant de lire les câbles.</p>
              </div>
              {selectedElement || selectedRelationship ? (
                <button type="button" onClick={clearFocus} className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-slate-300 hover:border-sky-400/40 hover:text-sky-100">
                  Clear focus
                </button>
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_150px]">
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
              onChange={(event) => { const v = event.target.value; startTransition(() => setLifecycleFilter(v as C4Lifecycle | "all")); }}
              className="rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 outline-none"
            >
              {lifecycleOptions.map((option) => (
                <option key={option} value={option}>{option === "all" ? "All lifecycles" : option}</option>
              ))}
            </select>
            </div>
          </div>
          <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/45 p-3">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Zones & types de flux</div>
            <div className="grid gap-2 md:grid-cols-[1fr_170px]">
            <div className="flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/45 p-2">
              {zoneOptions.map((zone) => (
                <button
                  key={zone}
                  type="button"
                  onClick={() => startTransition(() => setZoneFilter(zone))}
                  className={clsx(
                    "whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                    zoneFilter === zone
                      ? "bg-sky-400/15 text-sky-100 ring-1 ring-sky-300/30"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
                  )}
                >
                  <span
                    className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                    style={{ background: zone === "all" ? "#94a3b8" : zoneColor(zone) }}
                  />
                  {zone === "all" ? "All zones" : zone}
                </button>
              ))}
            </div>
            <select
              value={flowFilter}
              onChange={(event) => { const v = event.target.value; startTransition(() => setFlowFilter(v as FlowFilter)); }}
              className="rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 outline-none"
            >
              {flowOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
            </div>
          </div>
          <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/45 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Layers</div>
                <p className="mt-1 text-xs text-slate-500">Cache les calques bruyants sans perdre le contexte C4.</p>
              </div>
              <div className="flex gap-2">
                <select
                  value={density}
                  onChange={(event) => setDensity(event.target.value as DensityMode)}
                  className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 outline-none"
                >
                  {densityOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <select
                  value={labelMode}
                  onChange={(event) => setLabelMode(event.target.value as LabelMode)}
                  className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 outline-none"
                >
                  {labelOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
                <select
                  value={routingMode}
                  onChange={(event) => setRoutingMode(event.target.value as EdgeRoutingMode)}
                  className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 outline-none"
                >
                  {routingOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Routing actif: {effectiveRouting === "orthogonal" ? "angles droits (plus lisible/perf)" : effectiveRouting}.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {layerOptions.map((layer) => (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => toggleLayer(layer.id)}
                  className={clsx(
                    "rounded-xl border px-2 py-2 text-left text-xs transition",
                    activeLayers[layer.id]
                      ? "border-sky-300/20 bg-sky-400/10 text-sky-100"
                      : "border-white/10 bg-slate-950/50 text-slate-500",
                  )}
                >
                  <span className="block font-semibold">{layer.label}</span>
                  <span className="mt-1 block text-[10px] opacity-70">{layer.roles.join(", ")}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
              {flowOptions.filter((option) => option.id !== "all" && option.id !== "critical").map((option) => (
                <span key={option.id} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1">
                  <span className="h-1.5 w-5 rounded-full" style={{ background: flowColor(option.id.replace("-flow", "") as FlowKind) }} />
                  {option.label}
                </span>
              ))}
              {(["healthy", "degraded", "down", "unknown"] as HealthState[]).map((state) => (
                <span key={state} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1">
                  <HealthDot state={state} />
                  {healthLabel(state)}
                </span>
              ))}
            </div>
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
          edgeTypes={edgeTypes}
          onInit={setFlow}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={clearFocus}
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
              <button type="button" onClick={clearFocus} className="c4-tool-button min-w-16" aria-label="Clear focused element">
                Clear
              </button>
            </div>
          </Panel>
          {!isDenseView ? (
            <MiniMap
              pannable
              zoomable
              nodeStrokeWidth={3}
              nodeColor={(node) => {
                if (isBoundaryNode(node)) return "rgba(15, 23, 42, 0.2)";
                const element = (node.data as { element?: C4Element }).element;
                return element ? zoneColor(element) : "#38bdf8";
              }}
              nodeStrokeColor="rgba(186, 230, 253, 0.75)"
              maskColor="rgba(2, 6, 23, 0.58)"
            />
          ) : null}
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
