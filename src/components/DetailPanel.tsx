import Link from "next/link";
import type { C4Element, C4Relationship } from "@/types/c4";
import { simpleIconPath } from "@/lib/app-icons";
import { LifecycleBadge } from "./LifecycleBadge";
import { ProvenanceBadge } from "./ProvenanceBadge";

export function ElementDetail({ element }: { element: C4Element }) {
  const logoPath = element.icon ? simpleIconPath(element.icon.slug) : undefined;
  const app = element.app;
  return (
    <aside className="h-full overflow-auto border-l border-white/10 bg-slate-950/70 p-5 backdrop-blur">
      <div className="mb-4 flex items-center gap-2">
        <LifecycleBadge lifecycle={element.lifecycle} />
        <ProvenanceBadge sourceKind={element.source.sourceKind} />
      </div>
      <div className="flex items-start gap-3">
        {logoPath ? (
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-sky-300/20 bg-sky-400/15 text-sky-100">
            <svg viewBox="0 0 24 24" className="h-7 w-7" aria-label={element.icon?.title} role="img">
              <path fill="currentColor" d={logoPath} />
            </svg>
          </div>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-slate-100">{element.name}</h2>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-sky-300/80">{element.zone ?? "core"}</p>
        </div>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-400">{element.description ?? "No description available."}</p>
      {app ? (
        <Link
          href={`/apps/${app.namespace}/${app.name}`}
          className="mt-4 inline-flex rounded-xl border border-sky-300/20 bg-sky-400/10 px-3 py-2 text-xs font-semibold text-sky-100 hover:border-sky-300/40 hover:bg-sky-400/15"
        >
          Open app internals
        </Link>
      ) : null}
      <dl className="mt-5 grid gap-3 text-sm">
        <div><dt className="text-slate-500">Canonical ID</dt><dd className="text-slate-200">{element.canonicalId}</dd></div>
        <div><dt className="text-slate-500">Slug</dt><dd className="text-slate-200">{element.slug ?? "n/a"}</dd></div>
        <div><dt className="text-slate-500">Technology</dt><dd className="text-slate-200">{element.technology ?? "n/a"}</dd></div>
        <div><dt className="text-slate-500">Logo source</dt><dd className="text-slate-200">{element.icon ? `${element.icon.title} (${element.icon.source})` : "fallback"}</dd></div>
        <div><dt className="text-slate-500">Tags</dt><dd className="text-slate-200">{element.tags.join(", ") || "n/a"}</dd></div>
      </dl>
      {app ? (
        <section className="mt-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Runtime</h3>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Meta label="Kind" value={app.kind} />
              <Meta label="Replicas" value={String(app.replicas ?? "n/a")} />
              <Meta label="ServiceAccount" value={app.serviceAccount ?? "n/a"} />
              <Meta label="Services" value={String(app.services.length)} />
            </div>
          </div>
          <RuntimeList title="Containers" items={app.containers.map((container) => ({
            title: container.name,
            lines: [
              container.image ?? "image n/a",
              `${container.ports.length} ports · ${container.env.length} env · ${container.volumeMounts.length} mounts`,
              container.probes.length ? `probes: ${container.probes.join(", ")}` : "probes: n/a",
            ],
          }))} />
          <RuntimeList title="Config read-only" items={[
            ...app.configMaps.map((configMap) => ({
              title: `ConfigMap/${configMap.name}`,
              lines: [
                `${configMap.keys.length} keys`,
                configMap.redacted ? "values redacted by policy" : "values allowlisted",
              ],
            })),
            ...app.containers.flatMap((container) => [
              ...container.secretRefs.map((secret) => ({
                title: `Secret/${secret}`,
                lines: ["reference only · value never exported"],
              })),
              ...container.envFromSecrets.map((secret) => ({
                title: `Secret envFrom/${secret}`,
                lines: ["reference only · value never exported"],
              })),
            ]),
          ]} />
          <RuntimeList title="Volumes" items={app.volumes.map((volume) => ({
            title: `${volume.type}/${volume.name}`,
            lines: [volume.claimName ?? volume.configMapName ?? volume.secretName ?? "ephemeral"],
          }))} />
        </section>
      ) : null}
      <section className="mt-6">
        <h3 className="text-sm font-semibold text-slate-200">Documentation</h3>
        <div className="mt-3 space-y-2">
          {element.documentation.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-700 p-3 text-sm text-slate-500">No documentation linked yet.</p>
          ) : (
            element.documentation.map((doc) => (
              <div key={doc.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-200">{doc.title}</span>
                  <ProvenanceBadge sourceKind={doc.sourceKind} reviewed={doc.reviewed} />
                </div>
                {doc.path ? <p className="mt-1 text-xs text-slate-500">{doc.path}</p> : null}
              </div>
            ))
          )}
        </div>
      </section>
    </aside>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 truncate text-slate-200">{value}</dd>
    </div>
  );
}

function RuntimeList({ title, items }: { title: string; items: Array<{ title: string; lines: string[] }> }) {
  return (
    <section>
      <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</h4>
      <div className="mt-2 space-y-2">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-700 p-3 text-xs text-slate-500">No data exported.</p>
        ) : (
          items.map((item) => (
            <div key={`${title}-${item.title}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-sm font-medium text-slate-200">{item.title}</div>
              {item.lines.map((line) => (
                <div key={line} className="mt-1 truncate text-xs text-slate-500">{line}</div>
              ))}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export function RelationshipDetail({ relationship }: { relationship: C4Relationship }) {
  return (
    <aside className="h-full overflow-auto border-l border-white/10 bg-slate-950/70 p-5 backdrop-blur">
      <div className="mb-4 flex items-center gap-2">
        <LifecycleBadge lifecycle={relationship.lifecycle} />
        <ProvenanceBadge sourceKind={relationship.source.sourceKind} />
      </div>
      <h2 className="text-xl font-semibold text-slate-100">Relationship</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">{relationship.description ?? "No description available."}</p>
      <dl className="mt-5 grid gap-3 text-sm">
        <div><dt className="text-slate-500">Technology</dt><dd className="text-slate-200">{relationship.technology ?? "n/a"}</dd></div>
        <div><dt className="text-slate-500">Protocol</dt><dd className="text-slate-200">{relationship.protocol ?? "n/a"}</dd></div>
        <div><dt className="text-slate-500">Port</dt><dd className="text-slate-200">{relationship.port ?? "n/a"}</dd></div>
        <div><dt className="text-slate-500">Tags</dt><dd className="text-slate-200">{relationship.tags.join(", ") || "n/a"}</dd></div>
      </dl>
      <section className="mt-6">
        <h3 className="text-sm font-semibold text-slate-200">Documentation</h3>
        <div className="mt-3 space-y-2">
          {relationship.documentation.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-700 p-3 text-sm text-slate-500">No relationship documentation linked yet.</p>
          ) : (
            relationship.documentation.map((doc) => (
              <div key={doc.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-200">{doc.title}</span>
                  <ProvenanceBadge sourceKind={doc.sourceKind} reviewed={doc.reviewed} />
                </div>
                {doc.path ? <p className="mt-1 text-xs text-slate-500">{doc.path}</p> : null}
              </div>
            ))
          )}
        </div>
      </section>
    </aside>
  );
}
