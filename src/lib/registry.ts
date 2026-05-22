import type { C4DocumentationRef, C4Lifecycle, C4SourceMetadata, C4Version } from "@/types/c4";

export type RegistryElement = {
  canonicalId: string;
  lifecycle?: C4Lifecycle;
  documentation?: C4DocumentationRef[];
  source?: C4SourceMetadata;
};

export type RegistryRelationship = {
  id: string;
  lifecycle?: C4Lifecycle;
  protocol?: string;
  port?: number;
  documentation?: C4DocumentationRef[];
  source?: C4SourceMetadata;
};

export type C4Registry = {
  versions: C4Version[];
  elements: Record<string, RegistryElement>;
  relationships: Record<string, RegistryRelationship>;
};

export const publicFixtureRegistry: C4Registry = {
  versions: [
    {
      id: "live",
      label: "Production live",
      lifecycle: "live",
      description: "Anonymized live-like fixture used for public development.",
      sourceRef: "/api/workspace/1",
    },
    {
      id: "test-ai-stack",
      label: "AI stack experiment",
      lifecycle: "test",
      description: "Example test version for version-selector UX.",
      sourceRef: "/exports/versions/test-ai-stack/workspace.json",
    },
  ],
  elements: {
    "media.requests": {
      canonicalId: "media.requests",
      lifecycle: "live",
      documentation: [
        {
          id: "media.requests.overview",
          title: "Requests service overview",
          path: "docs/c4/registry/documentation/media.requests.md",
          sourceKind: "as-code",
          reviewed: true,
        },
      ],
      source: { sourceKind: "as-code", sourcePath: "fixture" },
    },
    "media.downloads": {
      canonicalId: "media.downloads",
      lifecycle: "live",
      documentation: [
        {
          id: "media.downloads.ai-summary",
          title: "Downloads AI summary",
          path: "docs/c4/registry/documentation/media.downloads.md",
          sourceKind: "ai",
          reviewed: false,
        },
      ],
      source: { sourceKind: "mixed", sourcePath: "fixture", generatedBy: "copilot" },
    },
  },
  relationships: {
    "media.requests.to.media.downloads.api": {
      id: "media.requests.to.media.downloads.api",
      lifecycle: "live",
      protocol: "HTTP",
      port: 8080,
      documentation: [
        {
          id: "media.requests.to.media.downloads.api",
          title: "Request to download API flow",
          path: "docs/c4/registry/documentation/relationships/media.requests.to.media.downloads.api.md",
          sourceKind: "human",
          reviewed: true,
        },
      ],
      source: { sourceKind: "human", reviewedBy: "Guilhem" },
    },
  },
};
