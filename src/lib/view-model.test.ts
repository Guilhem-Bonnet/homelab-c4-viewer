import { describe, expect, it } from "vitest";
import type { C4View } from "@/types/c4";
import { toFlow } from "./view-model";

const view: C4View = {
  key: "L2_Media",
  title: "Media",
  level: "container",
  versionId: "live",
  lifecycle: "live",
  elements: [
    {
      id: "jellyseerr",
      canonicalId: "media.jellyseerr",
      name: "media/jellyseerr",
      type: "Container",
      tags: ["Container", "media"],
      lifecycle: "live",
      documentation: [],
      source: { sourceKind: "as-code" },
    },
    {
      id: "radarr",
      canonicalId: "media.radarr",
      name: "media/radarr",
      type: "Container",
      tags: ["Container", "media"],
      lifecycle: "live",
      documentation: [],
      source: { sourceKind: "as-code" },
    },
    {
      id: "traefik",
      canonicalId: "edge.traefik",
      name: "traefik/traefik",
      type: "Container",
      tags: ["Container", "edge"],
      lifecycle: "live",
      documentation: [],
      source: { sourceKind: "as-code" },
    },
  ],
  relationships: [
    {
      id: "traefik-to-jellyseerr",
      sourceId: "traefik",
      targetId: "jellyseerr",
      description: "Expose route",
      protocol: "HTTPS",
      lifecycle: "live",
      tags: ["user-flow", "network-flow"],
      documentation: [],
      source: { sourceKind: "as-code" },
    },
    {
      id: "jellyseerr-to-radarr",
      sourceId: "jellyseerr",
      targetId: "radarr",
      description: "Requests movies",
      protocol: "HTTP",
      lifecycle: "live",
      tags: ["media-flow"],
      documentation: [],
      source: { sourceKind: "as-code" },
    },
  ],
};

describe("toFlow", () => {
  it("creates renderable edges and namespace boundaries", () => {
    const { nodes, edges } = toFlow(view);

    expect(edges).toHaveLength(2);
    expect(edges.map((edge) => `${edge.source}->${edge.target}`)).toEqual([
      "traefik->jellyseerr",
      "jellyseerr->radarr",
    ]);
    expect(nodes.some((node) => node.id === "boundary:media")).toBe(true);
    expect(nodes.find((node) => node.id === "boundary:media")?.data).toMatchObject({
      label: "media",
      count: 2,
      childIds: ["jellyseerr", "radarr"],
    });
    expect(nodes.filter((node) => !node.id.startsWith("boundary:")).every((node) => Number.isFinite(node.position.x))).toBe(true);
  });
});
