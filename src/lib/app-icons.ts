import {
  siAdguard,
  siAuthentik,
  siBookstack,
  siDocker,
  siFlux,
  siGrafana,
  siHomepage,
  siJellyfin,
  siKubernetes,
  siLonghorn,
  siMariadb,
  siN8n,
  siOllama,
  siPostgresql,
  siPrometheus,
  siQbittorrent,
  siQdrant,
  siRadarr,
  siRedis,
  siSonarr,
  siTraefikproxy,
  type SimpleIcon,
} from "simple-icons";
import type { C4AppIcon, C4Element } from "@/types/c4";

const iconsBySlug: Record<string, SimpleIcon> = {
  adguard: siAdguard,
  authentik: siAuthentik,
  bookstack: siBookstack,
  docker: siDocker,
  flux: siFlux,
  grafana: siGrafana,
  homepage: siHomepage,
  jellyfin: siJellyfin,
  kubernetes: siKubernetes,
  longhorn: siLonghorn,
  mariadb: siMariadb,
  n8n: siN8n,
  ollama: siOllama,
  postgresql: siPostgresql,
  prometheus: siPrometheus,
  qbittorrent: siQbittorrent,
  qdrant: siQdrant,
  radarr: siRadarr,
  redis: siRedis,
  sonarr: siSonarr,
  traefik: siTraefikproxy,
};

const aliases: Array<[RegExp, string]> = [
  [/jellyseerr/i, "homepage"],
  [/prowlarr/i, "sonarr"],
  [/bazarr/i, "sonarr"],
  [/flaresolverr/i, "docker"],
  [/tdarr/i, "jellyfin"],
  [/filebrowser/i, "homepage"],
  [/alertmanager|blackbox|node-exporter|kube-state-metrics/i, "prometheus"],
  [/alloy|pyroscope/i, "grafana"],
  [/postgres/i, "postgresql"],
  [/mariadb/i, "mariadb"],
  [/minecraft/i, "kubernetes"],
  [/structurizr|c4-viewer|c4-mcp/i, "kubernetes"],
  [/kyverno/i, "kubernetes"],
  [/traefik/i, "traefik"],
  [/authentik/i, "authentik"],
  [/adguard/i, "adguard"],
  [/longhorn/i, "longhorn"],
  [/flux|controller/i, "flux"],
  [/qdrant/i, "qdrant"],
  [/ollama/i, "ollama"],
  [/open-webui/i, "ollama"],
  [/n8n/i, "n8n"],
  [/bookstack/i, "bookstack"],
  [/grafana/i, "grafana"],
  [/prometheus/i, "prometheus"],
  [/redis/i, "redis"],
  [/jellyfin/i, "jellyfin"],
  [/sonarr/i, "sonarr"],
  [/radarr/i, "radarr"],
  [/qbittorrent/i, "qbittorrent"],
  [/homepage/i, "homepage"],
];

export function serviceSlug(name: string): string {
  const serviceName = name.includes("/") ? name.split("/").at(-1) ?? name : name;
  return serviceName
    .replace(/\s+\(PVC\)$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function iconForElement(element: Pick<C4Element, "name" | "tags">): C4AppIcon | undefined {
  const haystack = [element.name, ...element.tags].join(" ");
  const slug = aliases.find(([pattern]) => pattern.test(haystack))?.[1] ?? serviceSlug(element.name);
  const icon = iconsBySlug[slug];
  if (!icon) return undefined;

  return {
    slug,
    title: icon.title,
    hex: icon.hex,
    source: "simple-icons",
  };
}

export function simpleIconPath(slug: string): string | undefined {
  return iconsBySlug[slug]?.path;
}
