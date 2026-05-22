import { publicFixtureRegistry } from "./registry";
import { publicFixtureWorkspace } from "./fixture";
import { normalizeWorkspace } from "./structurizr-transform";
import type { NormalizedC4Model } from "@/types/c4";
import type { StructurizrWorkspace } from "@/types/structurizr";

const WORKSPACE_ENDPOINT = process.env.NEXT_PUBLIC_WORKSPACE_ENDPOINT ?? "/api/workspace/1";

export async function loadC4Model(): Promise<NormalizedC4Model> {
  if (typeof window === "undefined") {
    return normalizeWorkspace(publicFixtureWorkspace, publicFixtureRegistry);
  }

  try {
    const response = await fetch(WORKSPACE_ENDPOINT, { cache: "no-store" });
    if (!response.ok) throw new Error(`Workspace fetch failed: ${response.status}`);
    const workspace = (await response.json()) as StructurizrWorkspace;
    return normalizeWorkspace(workspace, publicFixtureRegistry);
  } catch {
    return normalizeWorkspace(publicFixtureWorkspace, publicFixtureRegistry);
  }
}
