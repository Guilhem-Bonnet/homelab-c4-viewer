import { describe, expect, it } from "vitest";
import { parseC4Metadata, parseStructurizrWorkspace } from "./c4-validation";

describe("C4 runtime validation", () => {
  it("accepts a minimal Structurizr workspace", () => {
    const workspace = parseStructurizrWorkspace({
      name: "HomeLab",
      model: {
        softwareSystems: [{ id: "1", name: "HomeLab", containers: [{ id: "2", name: "apps/homepage" }] }],
      },
      views: {
        containerViews: [{ key: "L2", elements: [{ id: "2" }], relationships: [] }],
      },
    });

    expect(workspace.views?.containerViews?.[0]?.key).toBe("L2");
  });

  it("rejects malformed Structurizr relationships before rendering", () => {
    expect(() =>
      parseStructurizrWorkspace({
        model: {
          relationships: [{ id: "r1", sourceId: "a" }],
        },
      }),
    ).toThrow(/Invalid Structurizr workspace/);
  });

  it("accepts generated app metadata with non-string allowlisted config values", () => {
    const metadata = parseC4Metadata({
      generatedAt: "2026-05-23 12:00 UTC",
      apps: {
        "apps/demo": {
          namespace: "apps",
          name: "demo",
          key: "apps/demo",
          kind: "deployment",
          labels: {},
          containers: [],
          volumes: [],
          configMaps: [{ name: "demo", keys: ["json"], redacted: false, data: { json: { enabled: true } } }],
          services: [],
          source: { sourceKind: "as-code" },
        },
      },
    });

    expect(metadata.apps["apps/demo"]?.configMaps[0]?.data?.json).toEqual({ enabled: true });
  });
});
