"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { LifecycleBadge } from "@/components/LifecycleBadge";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";
import { simpleIconPath } from "@/lib/app-icons";
import { loadC4ModelWithStatus, type C4ModelLoadResult } from "@/lib/structurizr-api";
import { flowColor, flowKind, healthLabel, healthState, nodeRole, zoneColor } from "@/lib/visual-style";
import type { C4Element, C4Relationship } from "@/types/c4";

export default function AppInternalsPage() {
  const params = useParams<{ namespace: string; name: string }>();
  const [loadResult, setLoadResult] = useState<C4ModelLoadResult | null>(null);

  useEffect(() => {
    loadC4ModelWithStatus().then(setLoadResult);
  }, []);

  const appKey = `${params.namespace}/${params.name}`;
  const element = useMemo(
    () => loadResult?.model.elements.find((candidate) => candidate.name === appKey),
    [appKey, loadResult?.model.elements],
  );
  const relationships = useMemo(
    () =>
      loadResult?.model.relationships.filter(
        (relationship) => relationship.sourceId === element?.id || relationship.targetId === element?.id,
      ) ?? [],
    [element?.id, loadResult?.model.relationships],
  );
  const elementById = useMemo(
    () => new Map(loadResult?.model.elements.map((candidate) => [candidate.id, candidate]) ?? []),
    [loadResult?.model.elements],
  );

  if (!loadResult) {
    return (
      <AppShell>
        <section className="mx-auto max-w-7xl px-6 py-16 text-slate-400">Loading app internals...</section>
      </AppShell>
    );
  }

  if (!element?.app) {
    return (
      <AppShell>
        <section className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-slate-400">App metadata not found for {appKey}.</p>
          <Link href="/" className="mt-4 inline-flex text-sm font-semibold text-sky-200">Back to overview</Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-6 py-10">
        <AppHeader element={element} />
        <div className="mt-8 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <Card title="Runtime">
            <div className="grid gap-3 md:grid-cols-2">
              <Meta label="Kind" value={element.app.kind} />
              <Meta label="Replicas" value={String(element.app.replicas ?? "n/a")} />
              <Meta label="Health" value={`${healthLabel(healthState(element))} · ${element.app.health?.readyReplicas ?? "?"}/${element.app.health?.desiredReplicas ?? "?"} ready`} />
              <Meta label="ServiceAccount" value={element.app.serviceAccount ?? "n/a"} />
              <Meta label="Services" value={element.app.services.map((service) => `${service.name}:${service.type}`).join(", ") || "n/a"} />
            </div>
          </Card>
          <Card title="Visual connections">
            <EgoGraph element={element} relationships={relationships} elementById={elementById} />
          </Card>
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.2fr_0.9fr]">
          <Card title="Containers">
            <Stack items={element.app.containers.map((container) => ({
              title: container.name,
              lines: [
                container.image ?? "image n/a",
                `${container.ports.length} ports · ${container.env.length} env vars · ${container.volumeMounts.length} mounts`,
                container.resources?.requests ? `requests: ${Object.entries(container.resources.requests).map(([k, v]) => `${k}=${v}`).join(", ")}` : "requests: n/a",
              ],
            }))} />
          </Card>
          <Card title="Config read-only">
            <ConfigMatrix element={element} />
          </Card>
          <Card title="Volumes">
            <Stack items={element.app.volumes.map((volume) => ({
              title: `${volume.type}/${volume.name}`,
              lines: [volume.claimName ?? volume.configMapName ?? volume.secretName ?? "ephemeral"],
            }))} />
          </Card>
        </div>
      </section>
    </AppShell>
  );
}

function AppHeader({ element }: { element: C4Element }) {
  const logoPath = element.icon ? simpleIconPath(element.icon.slug) : undefined;
  const accent = zoneColor(element);
  const health = healthState(element);
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur" style={{ "--c4-accent": accent } as CSSProperties}>
      <div className="flex flex-wrap items-start gap-4">
        {logoPath ? (
          <div className={`c4-node-icon c4-node-icon-${nodeRole(element)} h-16 w-16 rounded-3xl`}>
            <svg viewBox="0 0 24 24" className="h-9 w-9" aria-label={element.icon?.title} role="img">
              <path fill="currentColor" d={logoPath} />
            </svg>
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap gap-2">
            <LifecycleBadge lifecycle={element.lifecycle} />
            <ProvenanceBadge sourceKind={element.source.sourceKind} />
            <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-2.5 py-1 text-xs font-semibold text-sky-100">{element.zone}</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-slate-200`}>
              <span className={`c4-health-dot c4-health-${health}`} />
              {healthLabel(health)}
            </span>
          </div>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-50">{element.name}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{element.description ?? "Runtime and configuration read model exported from Kubernetes."}</p>
        </div>
        <Link href="/views/L2_AllContainers" className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5">
          Back to graph
        </Link>
      </div>
    </div>
  );
}

function EgoGraph({
  element,
  relationships,
  elementById,
}: {
  element: C4Element;
  relationships: C4Relationship[];
  elementById: Map<string, C4Element>;
}) {
  const incoming = relationships.filter((relationship) => relationship.targetId === element.id);
  const outgoing = relationships.filter((relationship) => relationship.sourceId === element.id);
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr]">
      <ConnectionColumn title="Incoming" relationships={incoming} elementById={elementById} side="source" />
      <div className="flex items-center justify-center">
        <div className="rounded-2xl border border-sky-300/30 bg-sky-400/10 px-4 py-3 text-center">
          <div className="text-sm font-semibold text-sky-100">{element.app?.name ?? element.name}</div>
          <div className="mt-1 text-xs text-slate-500">{relationships.length} links</div>
        </div>
      </div>
      <ConnectionColumn title="Outgoing" relationships={outgoing} elementById={elementById} side="target" />
    </div>
  );
}

function ConnectionColumn({
  title,
  relationships,
  elementById,
  side,
}: {
  title: string;
  relationships: C4Relationship[];
  elementById: Map<string, C4Element>;
  side: "source" | "target";
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</div>
      <div className="mt-2 space-y-2">
        {relationships.length === 0 ? <p className="rounded-xl border border-dashed border-slate-700 p-3 text-xs text-slate-500">No links.</p> : null}
        {relationships.map((relationship) => {
          const neighbor = elementById.get(side === "source" ? relationship.sourceId : relationship.targetId);
          const kind = flowKind(relationship);
          return (
            <div key={relationship.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-8 rounded-full" style={{ background: flowColor(kind) }} />
                <span className="truncate text-sm font-medium text-slate-200">{neighbor?.name ?? "Unknown"}</span>
              </div>
              <div className="mt-1 text-xs text-slate-500">{relationship.description ?? relationship.technology ?? kind}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConfigMatrix({ element }: { element: C4Element }) {
  const app = element.app;
  if (!app) return null;
  const configItems = [
    ...app.configMaps.map((configMap) => ({
      title: `ConfigMap/${configMap.name}`,
      lines: [
        configMap.keys.join(", ") || "no keys",
        configMap.redacted ? "values redacted by policy" : "values allowlisted",
        ...(configMap.data ? Object.entries(configMap.data).map(([key, value]) => `${key}: ${value}`) : []),
      ],
    })),
    ...app.containers.flatMap((container) => [
      { title: `Env/${container.name}`, lines: container.env.length ? container.env : ["no env vars"] },
      ...container.envFromConfigMaps.map((name) => ({ title: `envFrom ConfigMap/${name}`, lines: ["keys exposed through workload spec"] })),
      ...container.envFromSecrets.map((name) => ({ title: `envFrom Secret/${name}`, lines: ["reference only; values never exported"] })),
      ...container.configMapRefs.map((name) => ({ title: `ConfigMap key/${name}`, lines: ["reference only unless allowlisted"] })),
      ...container.secretRefs.map((name) => ({ title: `Secret/${name}`, lines: ["reference only; values never exported"] })),
    ]),
  ];
  return <Stack items={configItems} />;
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 shadow-xl backdrop-blur">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 break-words text-sm text-slate-200">{value}</div>
    </div>
  );
}

function Stack({ items }: { items: Array<{ title: string; lines: string[] }> }) {
  if (items.length === 0) {
    return <p className="rounded-xl border border-dashed border-slate-700 p-3 text-sm text-slate-500">No data exported.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="text-sm font-medium text-slate-200">{item.title}</div>
          {item.lines.map((line) => (
            <div key={line} className="mt-1 break-words text-xs text-slate-500">{line}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
