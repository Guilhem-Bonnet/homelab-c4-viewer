import { z } from "zod";
import type { C4MetadataBundle } from "@/types/c4";
import type { StructurizrWorkspace } from "@/types/structurizr";

const lifecycleSchema = z.enum(["live", "normal", "test", "deprecated"]);
const sourceKindSchema = z.enum(["as-code", "human", "ai", "mixed"]);

const structurizrRelationshipSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  destinationId: z.string().min(1),
  description: z.string().optional(),
  technology: z.string().optional(),
  tags: z.string().optional(),
});

const structurizrElementSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().optional(),
  description: z.string().optional(),
  technology: z.string().optional(),
  tags: z.string().optional(),
  relationships: z.array(structurizrRelationshipSchema).optional(),
});

const structurizrSoftwareSystemSchema = structurizrElementSchema.extend({
  containers: z.array(structurizrElementSchema).optional(),
});

const structurizrViewSchema = z.object({
  key: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  elements: z.array(z.object({ id: z.string().min(1), x: z.number().optional(), y: z.number().optional() })).optional(),
  relationships: z.array(z.object({ id: z.string().min(1) })).optional(),
});

const structurizrWorkspaceSchema = z.object({
  name: z.string().optional(),
  model: z.object({
    people: z.array(structurizrElementSchema).optional(),
    softwareSystems: z.array(structurizrSoftwareSystemSchema).optional(),
    relationships: z.array(structurizrRelationshipSchema).optional(),
  }).optional(),
  views: z.object({
    systemLandscapeViews: z.array(structurizrViewSchema).optional(),
    systemContextViews: z.array(structurizrViewSchema).optional(),
    containerViews: z.array(structurizrViewSchema).optional(),
  }).optional(),
});

const metadataSourceSchema = z.object({
  sourceKind: sourceKindSchema,
  sourcePath: z.string().optional(),
  generatedBy: z.string().optional(),
  reviewedBy: z.string().optional(),
});

const metadataPortSchema = z.object({
  name: z.string().optional(),
  port: z.number().optional(),
  targetPort: z.union([z.string(), z.number()]).optional(),
  containerPort: z.number().optional(),
  protocol: z.string().optional(),
});

const metadataConfigMapSchema = z.object({
  name: z.string().min(1),
  keys: z.array(z.string()),
  data: z.record(z.string(), z.unknown()).optional(),
  redacted: z.boolean(),
});

const metadataAppSchema = z.object({
  namespace: z.string().min(1),
  name: z.string().min(1),
  key: z.string().min(1),
  kind: z.string().min(1),
  replicas: z.number().optional(),
  serviceAccount: z.string().optional(),
  labels: z.record(z.string(), z.string()),
  containers: z.array(z.object({
    name: z.string().min(1),
    image: z.string().optional(),
    ports: z.array(metadataPortSchema),
    env: z.array(z.string()),
    envFromConfigMaps: z.array(z.string()),
    envFromSecrets: z.array(z.string()),
    configMapRefs: z.array(z.string()),
    secretRefs: z.array(z.string()),
    volumeMounts: z.array(z.string()),
    resources: z.object({
      requests: z.record(z.string(), z.string()).optional(),
      limits: z.record(z.string(), z.string()).optional(),
    }).optional(),
    probes: z.array(z.string()),
  })),
  volumes: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(["pvc", "configmap", "secret", "emptyDir", "hostPath", "other"]),
    claimName: z.string().optional(),
    configMapName: z.string().optional(),
    secretName: z.string().optional(),
  })),
  configMaps: z.array(metadataConfigMapSchema),
  secretRefs: z.array(z.string()).optional(),
  services: z.array(z.object({
    name: z.string().min(1),
    type: z.string().min(1),
    ports: z.array(metadataPortSchema),
  })),
  health: z.object({
    status: z.enum(["healthy", "degraded", "down", "unknown"]),
    desiredReplicas: z.number().optional(),
    readyReplicas: z.number().optional(),
    availableReplicas: z.number().optional(),
    conditions: z.array(z.object({
      type: z.string(),
      status: z.string(),
      reason: z.string().optional(),
      message: z.string().optional(),
    })).optional(),
  }).optional(),
  source: metadataSourceSchema,
});

const metadataBundleSchema = z.object({
  generatedAt: z.string().optional(),
  apps: z.record(z.string(), metadataAppSchema),
});

function formatValidationError(error: z.ZodError): string {
  return error.issues
    .slice(0, 5)
    .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
    .join("; ");
}

export function parseStructurizrWorkspace(value: unknown): StructurizrWorkspace {
  const result = structurizrWorkspaceSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`Invalid Structurizr workspace: ${formatValidationError(result.error)}`);
  }
  return result.data;
}

export function parseC4Metadata(value: unknown): C4MetadataBundle {
  const result = metadataBundleSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`Invalid C4 metadata: ${formatValidationError(result.error)}`);
  }
  return result.data;
}

export { lifecycleSchema };
