"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { LifecycleBadge } from "@/components/LifecycleBadge";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";
import { loadC4ModelWithStatus, type C4ModelLoadResult } from "@/lib/structurizr-api";

export default function DocsPage() {
  const [loadResult, setLoadResult] = useState<C4ModelLoadResult | null>(null);

  useEffect(() => {
    loadC4ModelWithStatus().then(setLoadResult);
  }, []);

  const docs = useMemo(() => {
    if (!loadResult) return [];
    const elementDocs = loadResult.model.elements.flatMap((element) =>
      element.documentation.map((doc) => ({ ...doc, owner: element.name, ownerType: "Element", lifecycle: element.lifecycle })),
    );
    const relationshipDocs = loadResult.model.relationships.flatMap((relationship) =>
      relationship.documentation.map((doc) => ({
        ...doc,
        owner: relationship.description ?? relationship.id,
        ownerType: "Relationship",
        lifecycle: relationship.lifecycle,
      })),
    );
    return [...elementDocs, ...relationshipDocs].sort((left, right) => left.title.localeCompare(right.title));
  }, [loadResult]);

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">Documentation</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-50">C4 documentation hub</h1>
          <p className="mt-5 text-lg leading-8 text-slate-400">
            Architecture notes are linked from elements and relationships, with explicit provenance for as-code,
            human-authored, AI-generated, and mixed sections. Private homelab documentation stays outside this public repo.
          </p>
        </div>

        {!loadResult ? (
          <p className="mt-10 text-slate-500">Loading documentation references...</p>
        ) : docs.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-slate-700 bg-white/[0.02] p-8 text-slate-400">
            No documentation references are attached to the current workspace yet.
          </div>
        ) : (
          <div className="mt-10 grid gap-4">
            {docs.map((doc) => (
              <article key={`${doc.ownerType}-${doc.id}`} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <LifecycleBadge lifecycle={doc.lifecycle} />
                  <ProvenanceBadge sourceKind={doc.sourceKind} reviewed={doc.reviewed} />
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs text-slate-500">{doc.ownerType}</span>
                </div>
                <h2 className="mt-4 text-xl font-semibold text-slate-100">{doc.title}</h2>
                <p className="mt-2 text-sm text-slate-500">{doc.owner}</p>
                {doc.path ? <p className="mt-3 rounded-xl bg-slate-900/70 px-3 py-2 font-mono text-xs text-slate-400">{doc.path}</p> : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
