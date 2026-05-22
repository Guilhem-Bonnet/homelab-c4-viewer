export type C4Lifecycle = "live" | "normal" | "test" | "deprecated";
export type C4SourceKind = "as-code" | "human" | "ai" | "mixed";

export type C4DocumentationRef = {
  id: string;
  title: string;
  path?: string;
  fragment?: string;
  sourceKind: C4SourceKind;
  generatedAt?: string;
  reviewed?: boolean;
};

export type C4SourceMetadata = {
  sourceKind: C4SourceKind;
  sourcePath?: string;
  generatedBy?: string;
  reviewedBy?: string;
};

export type C4Element = {
  id: string;
  canonicalId: string;
  name: string;
  type: string;
  tags: string[];
  description?: string;
  technology?: string;
  parentId?: string;
  icon?: string;
  color?: string;
  lifecycle: C4Lifecycle;
  documentation: C4DocumentationRef[];
  source: C4SourceMetadata;
};

export type C4Relationship = {
  id: string;
  sourceId: string;
  targetId: string;
  description?: string;
  technology?: string;
  protocol?: string;
  port?: number;
  lifecycle: C4Lifecycle;
  tags: string[];
  documentation: C4DocumentationRef[];
  source: C4SourceMetadata;
};

export type C4View = {
  key: string;
  title: string;
  description?: string;
  level: "system-landscape" | "system-context" | "container" | "component" | "deployment";
  versionId: string;
  lifecycle: C4Lifecycle;
  elements: C4Element[];
  relationships: C4Relationship[];
};

export type C4Version = {
  id: string;
  label: string;
  lifecycle: C4Lifecycle;
  createdAt?: string;
  description?: string;
  sourceRef?: string;
};

export type NormalizedC4Model = {
  title: string;
  versions: C4Version[];
  activeVersionId: string;
  views: C4View[];
  elements: C4Element[];
  relationships: C4Relationship[];
};
