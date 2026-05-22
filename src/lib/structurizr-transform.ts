import type {
  C4Element,
  C4Lifecycle,
  C4Relationship,
  C4View,
  NormalizedC4Model,
} from "@/types/c4";
import type { StructurizrElement, StructurizrRelationship, StructurizrWorkspace } from "@/types/structurizr";
import type { C4Registry } from "./registry";

function tags(value?: string): string[] {
  return (value ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function canonicalId(element: StructurizrElement): string {
  const domain = tags(element.tags).find((tag) => ["Media", "AI", "Edge", "AWS"].includes(tag))?.toLowerCase() ?? "core";
  return `${domain}.${element.name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/(^\\.|\\.$)/g, "")}`;
}

function lifecycleFromTags(elementTags: string[], fallback: C4Lifecycle = "live"): C4Lifecycle {
  if (elementTags.includes("Deprecated")) return "deprecated";
  if (elementTags.includes("Test")) return "test";
  return fallback;
}

function collectElements(workspace: StructurizrWorkspace): StructurizrElement[] {
  const systems = workspace.model?.softwareSystems ?? [];
  return [
    ...(workspace.model?.people ?? []),
    ...systems,
    ...systems.flatMap((system) => system.containers ?? []),
  ];
}

function collectRelationships(elements: StructurizrElement[], workspace: StructurizrWorkspace): StructurizrRelationship[] {
  return [
    ...(workspace.model?.relationships ?? []),
    ...elements.flatMap((element) => element.relationships ?? []),
  ];
}

function normalizeElement(element: StructurizrElement, registry: C4Registry): C4Element {
  const id = canonicalId(element);
  const elementTags = tags(element.tags);
  const overlay = registry.elements[id];
  return {
    id: element.id,
    canonicalId: id,
    name: element.name,
    type: element.type ?? "Element",
    description: element.description,
    technology: element.technology,
    tags: elementTags,
    lifecycle: overlay?.lifecycle ?? lifecycleFromTags(elementTags),
    documentation: overlay?.documentation ?? [],
    source: overlay?.source ?? { sourceKind: "as-code", sourcePath: "/api/workspace/1" },
  };
}

function relationshipId(
  relationship: StructurizrRelationship,
  elementById: Map<string, C4Element>,
): string {
  const source = elementById.get(relationship.sourceId)?.canonicalId ?? relationship.sourceId;
  const target = elementById.get(relationship.destinationId)?.canonicalId ?? relationship.destinationId;
  const purpose = (relationship.description ?? relationship.technology ?? "flow")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/(^\\.|\\.$)/g, "");
  return `${source}.to.${target}.${purpose || "flow"}`;
}

function normalizeRelationship(
  relationship: StructurizrRelationship,
  registry: C4Registry,
  elementById: Map<string, C4Element>,
): C4Relationship {
  const id = relationshipId(relationship, elementById);
  const relationshipTags = tags(relationship.tags);
  const overlay = registry.relationships[id];
  return {
    id,
    sourceId: relationship.sourceId,
    targetId: relationship.destinationId,
    description: relationship.description,
    technology: relationship.technology,
    protocol: overlay?.protocol ?? relationship.technology?.split(" ")[0],
    port: overlay?.port,
    lifecycle: overlay?.lifecycle ?? lifecycleFromTags(relationshipTags),
    tags: relationshipTags,
    documentation: overlay?.documentation ?? [],
    source: overlay?.source ?? { sourceKind: "as-code", sourcePath: "/api/workspace/1" },
  };
}

export function normalizeWorkspace(workspace: StructurizrWorkspace, registry: C4Registry): NormalizedC4Model {
  const elements = collectElements(workspace).map((element) => normalizeElement(element, registry));
  const elementById = new Map(elements.map((element) => [element.id, element]));
  const relationships = collectRelationships(collectElements(workspace), workspace).map((relationship) =>
    normalizeRelationship(relationship, registry, elementById),
  );
  const relationshipById = new Map(relationships.map((relationship) => [relationship.id, relationship]));
  const structurizrRelationshipById = new Map(
    collectRelationships(collectElements(workspace), workspace).map((relationship) => [relationship.id, relationship]),
  );

  const containerViews: C4View[] = (workspace.views?.containerViews ?? []).map((view) => {
    const viewElementIds = new Set((view.elements ?? []).map((element) => element.id));
    const viewElements = elements.filter((element) => viewElementIds.has(element.id));
    const viewRelationships = (view.relationships ?? [])
      .map((relationshipRef) => structurizrRelationshipById.get(relationshipRef.id))
      .filter((relationship): relationship is StructurizrRelationship => Boolean(relationship))
      .map((relationship) => relationshipById.get(relationshipId(relationship, elementById)))
      .filter((relationship): relationship is C4Relationship => Boolean(relationship));

    return {
      key: view.key,
      title: view.title ?? view.key,
      description: view.description,
      level: "container",
      versionId: registry.versions[0]?.id ?? "live",
      lifecycle: registry.versions[0]?.lifecycle ?? "live",
      elements: viewElements,
      relationships: viewRelationships,
    };
  });

  return {
    title: workspace.name ?? "C4 Workspace",
    versions: registry.versions,
    activeVersionId: registry.versions[0]?.id ?? "live",
    views: containerViews,
    elements,
    relationships,
  };
}
