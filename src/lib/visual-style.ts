import type { C4Element, C4Relationship } from "@/types/c4";

export type NodeRole = "app" | "storage" | "gateway" | "security" | "observability" | "database" | "external" | "cloud";
export type FlowKind = "user" | "storage" | "security" | "observability" | "gitops" | "backup" | "network" | "service";
export type HealthState = "healthy" | "degraded" | "down" | "unknown";

const zoneColors: Record<string, string> = {
  apps: "#a78bfa",
  media: "#38bdf8",
  minecraft: "#34d399",
  monitoring: "#f59e0b",
  authentik: "#fb7185",
  kyverno: "#f97316",
  traefik: "#22d3ee",
  adguard: "#84cc16",
  "c4-diagrams": "#60a5fa",
  aws: "#ff9900",
  external: "#94a3b8",
  storage: "#818cf8",
};

function normalized(value?: string): string {
  return (value ?? "").toLowerCase();
}

function hasTag(element: C4Element, needle: string): boolean {
  return element.tags.some((tag) => tag.toLowerCase().includes(needle));
}

export function zoneKey(element: C4Element): string {
  return normalized(element.zone ?? element.name.split("/")[0] ?? element.canonicalId.split(".")[0] ?? "core")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function zoneColor(elementOrZone: C4Element | string): string {
  const key = typeof elementOrZone === "string" ? normalized(elementOrZone) : zoneKey(elementOrZone);
  return zoneColors[key] ?? "#38bdf8";
}

export function nodeRole(element: C4Element): NodeRole {
  const haystack = normalized([element.name, element.type, element.technology, ...element.tags].join(" "));
  if (haystack.includes("aws") || element.zone === "aws") return "cloud";
  if (haystack.includes("external") || hasTag(element, "external")) return "external";
  if (haystack.includes("pvc") || haystack.includes("longhorn") || haystack.includes("nfs") || hasTag(element, "storage")) return "storage";
  if (haystack.includes("mariadb") || haystack.includes("postgres") || haystack.includes("redis") || hasTag(element, "database")) return "database";
  if (haystack.includes("traefik") || haystack.includes("ingress") || haystack.includes("dns")) return "gateway";
  if (haystack.includes("auth") || haystack.includes("sso") || haystack.includes("secret") || haystack.includes("kyverno") || haystack.includes("trivy")) return "security";
  if (haystack.includes("grafana") || haystack.includes("prometheus") || haystack.includes("alert") || haystack.includes("monitor")) return "observability";
  return "app";
}

export function flowKind(relationship: C4Relationship): FlowKind {
  const tags = relationship.tags.map((tag) => tag.toLowerCase());
  if (tags.some((tag) => tag.includes("user"))) return "user";
  if (tags.some((tag) => tag.includes("storage") || tag.includes("state"))) return "storage";
  if (tags.some((tag) => tag.includes("security") || tag.includes("dns"))) return "security";
  if (tags.some((tag) => tag.includes("observability"))) return "observability";
  if (tags.some((tag) => tag.includes("gitops"))) return "gitops";
  if (tags.some((tag) => tag.includes("backup"))) return "backup";
  if (tags.some((tag) => tag.includes("network"))) return "network";
  return "service";
}

export function flowColor(kind: FlowKind): string {
  switch (kind) {
    case "user":
      return "#38bdf8";
    case "storage":
      return "#818cf8";
    case "security":
      return "#fb7185";
    case "observability":
      return "#f59e0b";
    case "gitops":
      return "#22c55e";
    case "backup":
      return "#a78bfa";
    case "network":
      return "#2dd4bf";
    default:
      return "#94a3b8";
  }
}

export function healthState(element: C4Element): HealthState {
  return element.app?.health?.status ?? (element.app ? "unknown" : "unknown");
}

export function healthLabel(state: HealthState): string {
  switch (state) {
    case "healthy":
      return "Healthy";
    case "degraded":
      return "Degraded";
    case "down":
      return "Down";
    default:
      return "Unknown";
  }
}

