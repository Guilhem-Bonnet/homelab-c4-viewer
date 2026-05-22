import { publicFixtureRegistry } from "./registry";
import { publicFixtureWorkspace } from "./fixture";
import { normalizeWorkspace } from "./structurizr-transform";
import type { NormalizedC4Model } from "@/types/c4";
import type { StructurizrWorkspace } from "@/types/structurizr";

const WORKSPACE_ENDPOINT = process.env.NEXT_PUBLIC_WORKSPACE_ENDPOINT ?? "/api/workspace/1";

export type C4ModelLoadResult = {
  model: NormalizedC4Model;
  source: "live" | "fixture";
  endpoint: string;
  error?: string;
};

export async function loadC4ModelWithStatus(): Promise<C4ModelLoadResult> {
  if (typeof window === "undefined") {
    return {
      model: normalizeWorkspace(publicFixtureWorkspace, publicFixtureRegistry),
      source: "fixture",
      endpoint: WORKSPACE_ENDPOINT,
    };
  }

  try {
    const response = await fetch(WORKSPACE_ENDPOINT, { cache: "no-store" });
    if (!response.ok) throw new Error(`Workspace fetch failed: ${response.status}`);
    const workspace = (await response.json()) as StructurizrWorkspace;
    return {
      model: normalizeWorkspace(workspace, publicFixtureRegistry),
      source: "live",
      endpoint: WORKSPACE_ENDPOINT,
    };
  } catch (error) {
    return {
      model: normalizeWorkspace(publicFixtureWorkspace, publicFixtureRegistry),
      source: "fixture",
      endpoint: WORKSPACE_ENDPOINT,
      error: error instanceof Error ? error.message : "Unknown workspace loading error",
    };
  }
}

export async function loadC4Model(): Promise<NormalizedC4Model> {
  return (await loadC4ModelWithStatus()).model;
}
