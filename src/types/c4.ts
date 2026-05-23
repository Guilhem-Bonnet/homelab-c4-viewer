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

export type C4AppIcon = {
  slug: string;
  title: string;
  hex: string;
  source: "simple-icons" | "custom" | "fallback";
};

export type C4Port = {
  name?: string;
  port?: number;
  targetPort?: string | number;
  containerPort?: number;
  protocol?: string;
};

export type C4ContainerRuntime = {
  name: string;
  image?: string;
  ports: C4Port[];
  env: string[];
  envFromConfigMaps: string[];
  envFromSecrets: string[];
  configMapRefs: string[];
  secretRefs: string[];
  volumeMounts: string[];
  resources?: {
    requests?: Record<string, string>;
    limits?: Record<string, string>;
  };
  probes: string[];
};

export type C4VolumeRef = {
  name: string;
  type: "pvc" | "configmap" | "secret" | "emptyDir" | "hostPath" | "other";
  claimName?: string;
  configMapName?: string;
  secretName?: string;
};

export type C4ConfigMapSummary = {
  name: string;
  keys: string[];
  data?: Record<string, string>;
  redacted: boolean;
};

export type C4ServiceSummary = {
  name: string;
  type: string;
  ports: C4Port[];
};

export type C4AppMetadata = {
  namespace: string;
  name: string;
  key: string;
  kind: string;
  replicas?: number;
  serviceAccount?: string;
  labels: Record<string, string>;
  containers: C4ContainerRuntime[];
  volumes: C4VolumeRef[];
  configMaps: C4ConfigMapSummary[];
  secretRefs?: string[];
  services: C4ServiceSummary[];
  source: C4SourceMetadata;
};

export type C4MetadataBundle = {
  generatedAt?: string;
  apps: Record<string, C4AppMetadata>;
};

export type C4Element = {
  id: string;
  canonicalId: string;
  slug?: string;
  zone?: string;
  name: string;
  type: string;
  tags: string[];
  description?: string;
  technology?: string;
  parentId?: string;
  icon?: C4AppIcon;
  color?: string;
  app?: C4AppMetadata;
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
  metadata?: C4MetadataBundle;
};
