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

type IconDefinition = Pick<SimpleIcon, "path" | "title" | "hex">;

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

const customIconsBySlug: Record<string, IconDefinition> = {
  aws: {
    title: "AWS",
    hex: "FF9900",
    path: "M3 7.2 12 2l9 5.2v9.6L12 22l-9-5.2V7.2Zm2 1.15v7.3l7 4.04 7-4.04v-7.3l-7-4.04-7 4.04Zm3.2 6.85 1.12-6.4h1.65l1.03 3.9 1.03-3.9h1.65l1.12 6.4h-1.42l-.56-4.16-1.1 4.16h-1.44l-1.1-4.16-.56 4.16H8.2Z",
  },
  "aws-s3": {
    title: "Amazon S3",
    hex: "569A31",
    path: "M6 5.2C6 3.43 8.69 2 12 2s6 1.43 6 3.2v13.6C18 20.57 15.31 22 12 22s-6-1.43-6-3.2V5.2Zm2 0c0 .5 1.43 1.2 4 1.2s4-.7 4-1.2S14.57 4 12 4s-4 .7-4 1.2Zm0 3.3v3.1c1.08.62 2.48.95 4 .95s2.92-.33 4-.95V8.5c-1.08.58-2.47.9-4 .9s-2.92-.32-4-.9Zm0 6.25v4.05c0 .5 1.43 1.2 4 1.2s4-.7 4-1.2v-4.05c-1.1.52-2.48.8-4 .8s-2.9-.28-4-.8Z",
  },
  "aws-dynamodb": {
    title: "Amazon DynamoDB",
    hex: "4053D6",
    path: "M4 4.5 12 2l8 2.5v15L12 22l-8-2.5v-15Zm2 1.48v12.04l5 1.56V7.54L6 5.98Zm7 1.56v12.04l5-1.56V5.98l-5 1.56Zm-1-1.72 3.9-1.22L12 3.38 8.1 4.6 12 5.82Z",
  },
  "aws-route53": {
    title: "Amazon Route 53",
    hex: "8C4FFF",
    path: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2c1.08 0 2.08 1.35 2.62 3.35H9.38C9.92 5.35 10.92 4 12 4ZM4.53 13a8.3 8.3 0 0 1 0-2h3.02a15.3 15.3 0 0 0 0 2H4.53Zm.82 2h2.6c.28 1.26.73 2.34 1.32 3.16A8.05 8.05 0 0 1 5.35 15Zm2.6-6h-2.6a8.05 8.05 0 0 1 3.92-3.16A11.1 11.1 0 0 0 7.95 9Zm4.05 11c-1.08 0-2.08-1.35-2.62-3.35h5.24C14.08 18.65 13.08 20 12 20Zm3.04-5.35H8.96a13.4 13.4 0 0 1 0-5.3h6.08a13.4 13.4 0 0 1 0 5.3Zm-.31 3.51c.59-.82 1.04-1.9 1.32-3.16h2.6a8.05 8.05 0 0 1-3.92 3.16ZM16.45 13a15.3 15.3 0 0 0 0-2h3.02a8.3 8.3 0 0 1 0 2h-3.02Zm-.4-4a11.1 11.1 0 0 0-1.32-3.16A8.05 8.05 0 0 1 18.65 9h-2.6Z",
  },
  "aws-kms": {
    title: "AWS Key Management Service",
    hex: "DD344C",
    path: "M12 2a5 5 0 0 0-5 5v2H5v13h14V9h-2V7a5 5 0 0 0-5-5Zm-3 7V7a3 3 0 1 1 6 0v2H9Zm-2 2h10v9H7v-9Zm5 2.2a1.7 1.7 0 0 0-1 3.07V18h2v-1.73a1.7 1.7 0 0 0-1-3.07Z",
  },
  "aws-iam": {
    title: "AWS Identity and Access Management",
    hex: "DD344C",
    path: "M12 2 4 5.1v5.9c0 5.1 3.33 8.93 8 11 4.67-2.07 8-5.9 8-11V5.1L12 2Zm0 2.15 6 2.33V11c0 3.93-2.36 6.9-6 8.78C8.36 17.9 6 14.93 6 11V6.48l6-2.33Zm0 3.35a3 3 0 0 0-1.2 5.75c-1.73.48-2.8 1.66-2.8 3.25h8c0-1.59-1.07-2.77-2.8-3.25A3 3 0 0 0 12 7.5Zm0 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z",
  },
  "aws-budgets": {
    title: "AWS Budgets",
    hex: "7AA116",
    path: "M4 5h16v14H4V5Zm2 2v10h12V7H6Zm2 8v-2h2v2H8Zm3 0V9h2v6h-2Zm3 0v-4h2v4h-2Z",
  },
};

const aliases: Array<[RegExp, string]> = [
  [/simple storage service|s3 terraform|s3 backups|amazon web services - simple storage service/i, "aws-s3"],
  [/dynamodb|amazon web services - dynamodb/i, "aws-dynamodb"],
  [/route\s*53|route53|amazon web services - route 53/i, "aws-route53"],
  [/\bkms\b|key management service|amazon web services - key management service/i, "aws-kms"],
  [/\biam\b|identity and access management|amazon web services - identity and access management/i, "aws-iam"],
  [/budgets|cost anomaly|amazon web services - budgets/i, "aws-budgets"],
  [/\baws\b|amazon web services/i, "aws"],
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
  const icon = customIconsBySlug[slug] ?? iconsBySlug[slug];
  if (!icon) return undefined;

  return {
    slug,
    title: icon.title,
    hex: icon.hex,
    source: customIconsBySlug[slug] ? "custom" : "simple-icons",
  };
}

export function simpleIconPath(slug: string): string | undefined {
  return customIconsBySlug[slug]?.path ?? iconsBySlug[slug]?.path;
}
