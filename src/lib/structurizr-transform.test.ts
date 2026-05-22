import { describe, expect, it } from "vitest";
import type { C4Registry } from "./registry";
import { normalizeWorkspace } from "./structurizr-transform";
import type { StructurizrWorkspace } from "@/types/structurizr";

const registry: C4Registry = {
  versions: [{ id: "live", label: "Live", lifecycle: "live" }],
  elements: {},
  relationships: {},
};

describe("normalizeWorkspace", () => {
  it("keeps referenced and inferred relationships in container views", () => {
    const workspace: StructurizrWorkspace = {
      name: "Test workspace",
      model: {
        softwareSystems: [
          {
            id: "1",
            name: "HomeLab",
            type: "Software System",
            containers: [
              {
                id: "2",
                name: "media/jellyseerr",
                type: "Container",
                tags: "Container,media",
                relationships: [
                  {
                    id: "r1",
                    sourceId: "2",
                    destinationId: "3",
                    description: "Requests movies",
                    technology: "HTTP API",
                    tags: "Relationship,media-flow",
                  },
                ],
              },
              {
                id: "3",
                name: "media/radarr",
                type: "Container",
                tags: "Container,media",
              },
              {
                id: "4",
                name: "media/radarr-config (PVC)",
                type: "Container",
                tags: "Container,storage,pvc",
              },
            ],
          },
        ],
        relationships: [
          {
            id: "r2",
            sourceId: "3",
            destinationId: "4",
            description: "Persists data",
            technology: "PVC / Longhorn",
            tags: "Relationship,storage-flow",
          },
        ],
      },
      views: {
        containerViews: [
          {
            key: "L2_Media",
            elements: [{ id: "2" }, { id: "3" }, { id: "4" }],
            relationships: [{ id: "r1" }],
          },
        ],
      },
    };

    const model = normalizeWorkspace(workspace, registry);
    const view = model.views.find((candidate) => candidate.key === "L2_Media");

    expect(model.relationships).toHaveLength(2);
    expect(view?.relationships.map((relationship) => relationship.id).sort()).toEqual([
      "media.media.jellyseerr.to.media.media.radarr.requests.movies",
      "media.media.radarr.to.core.media.radarr.config.pvc.persists.data",
    ]);
  });
});
