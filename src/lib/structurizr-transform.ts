import type {
  C4Element,
  C4Lifecycle,
  C4Relationship,
  C4View,
  NormalizedC4Model,
} from "@/types/c4";
import type { StructurizrContainerView, StructurizrElement, StructurizrRelationship, StructurizrWorkspace } from "@/types/structurizr";
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

type ElementWithParent = StructurizrElement & { parentId?: string };

function collectElements(workspace: StructurizrWorkspace): ElementWithParent[] {
  const systems = workspace.model?.softwareSystems ?? [];
  return [
    ...(workspace.model?.people ?? []),
    ...systems,
    ...systems.flatMap((system) => (system.containers ?? []).map((container) => ({ ...container, parentId: system.id }))),
  ];
}

function collectRelationships(elements: StructurizrElement[], workspace: StructurizrWorkspace): StructurizrRelationship[] {
  return [
    ...(workspace.model?.relationships ?? []),
    ...elements.flatMap((element) => element.relationships ?? []),
  ];
}

function normalizeElement(element: ElementWithParent, registry: C4Registry): C4Element {
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
    parentId: element.parentId,
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
  const rawElements = collectElements(workspace);
  const rawRelationships = collectRelationships(rawElements, workspace);
  const elements = rawElements.map((element) => normalizeElement(element, registry));
  const elementById = new Map(elements.map((element) => [element.id, element]));
  const relationships = rawRelationships.map((relationship) =>
    normalizeRelationship(relationship, registry, elementById),
  );
  const normalizedRelationshipByStructurizrId = new Map(
    rawRelationships.map((relationship, index) => [relationship.id, relationships[index]]),
  );

  function normalizeView(
    view: StructurizrContainerView,
    level: C4View["level"],
  ): C4View {
    const viewElementIds = new Set((view.elements ?? []).map((element) => element.id));
    const viewElements = elements.filter((element) => viewElementIds.has(element.id));
    const referencedRelationships = (view.relationships ?? [])
      .map((relationshipRef) => normalizedRelationshipByStructurizrId.get(relationshipRef.id))
      .filter((relationship): relationship is C4Relationship => Boolean(relationship))
      .filter((relationship) => viewElementIds.has(relationship.sourceId) && viewElementIds.has(relationship.targetId));
    const inferredRelationships = relationships.filter(
      (relationship) => viewElementIds.has(relationship.sourceId) && viewElementIds.has(relationship.targetId),
    );
    const viewRelationships = Array.from(
      new Map([...referencedRelationships, ...inferredRelationships].map((relationship) => [relationship.id, relationship])).values(),
    );

    return {
      key: view.key,
      title: view.title ?? view.key,
      description: view.description,
      level,
      versionId: registry.versions[0]?.id ?? "live",
      lifecycle: registry.versions[0]?.lifecycle ?? "live",
      elements: viewElements,
      relationships: viewRelationships,
    };
  }

  const views: C4View[] = [
    ...(workspace.views?.systemLandscapeViews ?? []).map((view) => normalizeView(view, "system-landscape")),
    ...(workspace.views?.systemContextViews ?? []).map((view) => normalizeView(view, "system-context")),
    ...(workspace.views?.containerViews ?? []).map((view) => normalizeView(view, "container")),
  ];

  return {
    title: workspace.name ?? "C4 Workspace",
    versions: registry.versions,
    activeVersionId: registry.versions[0]?.id ?? "live",
    views,
    elements,
    relationships,
  };
}
