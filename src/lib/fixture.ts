import type { StructurizrWorkspace } from "@/types/structurizr";

export const publicFixtureWorkspace: StructurizrWorkspace = {
  name: "HomeLab C4 Fixture",
  model: {
    people: [
      {
        id: "user",
        name: "Home user",
        type: "Person",
        description: "Anonymized user actor.",
        tags: "Person,External",
      },
    ],
    softwareSystems: [
      {
        id: "homelab",
        name: "HomeLab Platform",
        type: "Software System",
        description: "Anonymized homelab platform.",
        tags: "Internal,Kubernetes",
        containers: [
          {
            id: "requests",
            name: "Requests",
            type: "Container",
            description: "Public-safe request management example.",
            technology: "Web UI",
            tags: "Container,Media",
            relationships: [
              {
                id: "rel-requests-downloads",
                sourceId: "requests",
                destinationId: "downloads",
                description: "Creates download jobs",
                technology: "HTTP API",
                tags: "Relationship,Media",
              },
            ],
          },
          {
            id: "downloads",
            name: "Downloads",
            type: "Container",
            description: "Public-safe download worker example.",
            technology: "Worker",
            tags: "Container,Media,Queue",
          },
          {
            id: "catalog",
            name: "Catalog DB",
            type: "Container",
            description: "Public-safe storage example.",
            technology: "PostgreSQL",
            tags: "Container,Database",
          },
        ],
      },
    ],
  },
  views: {
    containerViews: [
      {
        key: "L2_MediaPipeline",
        title: "Media Pipeline",
        description: "Anonymized media flow fixture.",
        elements: [{ id: "user" }, { id: "requests" }, { id: "downloads" }, { id: "catalog" }],
        relationships: [{ id: "rel-requests-downloads" }],
      },
    ],
  },
};
