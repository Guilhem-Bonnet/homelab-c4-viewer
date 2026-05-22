import type { C4Element, C4Relationship } from "@/types/c4";
import { LifecycleBadge } from "./LifecycleBadge";
import { ProvenanceBadge } from "./ProvenanceBadge";

export function ElementDetail({ element }: { element: C4Element }) {
  return (
    <aside className="h-full overflow-auto border-l border-white/10 bg-slate-950/70 p-5 backdrop-blur">
      <div className="mb-4 flex items-center gap-2">
        <LifecycleBadge lifecycle={element.lifecycle} />
        <ProvenanceBadge sourceKind={element.source.sourceKind} />
      </div>
      <h2 className="text-xl font-semibold text-slate-100">{element.name}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">{element.description ?? "No description available."}</p>
      <dl className="mt-5 grid gap-3 text-sm">
        <div><dt className="text-slate-500">Canonical ID</dt><dd className="text-slate-200">{element.canonicalId}</dd></div>
        <div><dt className="text-slate-500">Technology</dt><dd className="text-slate-200">{element.technology ?? "n/a"}</dd></div>
        <div><dt className="text-slate-500">Tags</dt><dd className="text-slate-200">{element.tags.join(", ") || "n/a"}</dd></div>
      </dl>
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
      </dl>
    </aside>
  );
}
