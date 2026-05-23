"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { LifecycleBadge } from "@/components/LifecycleBadge";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";
import { simpleIconPath } from "@/lib/app-icons";
import { loadC4ModelWithStatus, type C4ModelLoadResult } from "@/lib/structurizr-api";
import type { C4Element } from "@/types/c4";

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
              <Meta label="ServiceAccount" value={element.app.serviceAccount ?? "n/a"} />
              <Meta label="Services" value={element.app.services.map((service) => `${service.name}:${service.type}`).join(", ") || "n/a"} />
            </div>
          </Card>
          <Card title="Relationship impact">
            <div className="space-y-2">
              {relationships.length === 0 ? (
                <p className="text-sm text-slate-500">No direct relationship exported.</p>
              ) : (
                relationships.map((relationship) => (
                  <div key={relationship.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-sm text-slate-200">{relationship.description ?? relationship.id}</div>
                    <div className="mt-1 text-xs text-slate-500">{relationship.technology ?? relationship.protocol ?? "flow"}</div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-3">
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
            <Stack items={[
              ...element.app.configMaps.map((configMap) => ({
                title: `ConfigMap/${configMap.name}`,
                lines: [
                  configMap.keys.join(", ") || "no keys",
                  configMap.redacted ? "values redacted by policy" : "values allowlisted",
                ],
              })),
              ...element.app.containers.flatMap((container) => [
                ...container.envFromConfigMaps.map((name) => ({ title: `envFrom ConfigMap/${name}`, lines: ["keys exposed through workload spec"] })),
                ...container.envFromSecrets.map((name) => ({ title: `envFrom Secret/${name}`, lines: ["reference only; values never exported"] })),
                ...container.secretRefs.map((name) => ({ title: `Secret/${name}`, lines: ["reference only; values never exported"] })),
              ]),
            ]} />
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
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur">
      <div className="flex flex-wrap items-start gap-4">
        {logoPath ? (
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl border border-sky-300/20 bg-sky-400/15 text-sky-100">
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
