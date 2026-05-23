import { publicFixtureRegistry } from "./registry";
import { publicFixtureWorkspace } from "./fixture";
import { normalizeWorkspace } from "./structurizr-transform";
import { parseC4Metadata, parseStructurizrWorkspace } from "./c4-validation";
import type { C4MetadataBundle, NormalizedC4Model } from "@/types/c4";

const WORKSPACE_ENDPOINT = process.env.NEXT_PUBLIC_WORKSPACE_ENDPOINT ?? "/api/workspace/1";
const METADATA_ENDPOINT = process.env.NEXT_PUBLIC_METADATA_ENDPOINT ?? "/exports/metadata/live/config.json";

export type C4ModelLoadResult = {
  model: NormalizedC4Model;
  source: "live" | "fixture";
  endpoint: string;
  metadataEndpoint: string;
  error?: string;
};

async function loadMetadata(): Promise<C4MetadataBundle | undefined> {
  const response = await fetch(METADATA_ENDPOINT, { cache: "no-store" });
  if (!response.ok) return undefined;
  return parseC4Metadata(await response.json());
}

export async function loadC4ModelWithStatus(): Promise<C4ModelLoadResult> {
  if (typeof window === "undefined") {
    return {
      model: normalizeWorkspace(publicFixtureWorkspace, publicFixtureRegistry),
      source: "fixture",
      endpoint: WORKSPACE_ENDPOINT,
      metadataEndpoint: METADATA_ENDPOINT,
    };
  }

  try {
    const [response, metadata] = await Promise.all([
      fetch(WORKSPACE_ENDPOINT, { cache: "no-store" }),
      loadMetadata().catch(() => undefined),
    ]);
    if (!response.ok) throw new Error(`Workspace fetch failed: ${response.status}`);
    const workspace = parseStructurizrWorkspace(await response.json());
    return {
      model: normalizeWorkspace(workspace, publicFixtureRegistry, metadata),
      source: "live",
      endpoint: WORKSPACE_ENDPOINT,
      metadataEndpoint: METADATA_ENDPOINT,
    };
  } catch (error) {
    return {
      model: normalizeWorkspace(publicFixtureWorkspace, publicFixtureRegistry),
      source: "fixture",
      endpoint: WORKSPACE_ENDPOINT,
      metadataEndpoint: METADATA_ENDPOINT,
      error: error instanceof Error ? error.message : "Unknown workspace loading error",
    };
  }
}

export async function loadC4Model(): Promise<NormalizedC4Model> {
  return (await loadC4ModelWithStatus()).model;
}
