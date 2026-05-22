"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { LifecycleBadge } from "@/components/LifecycleBadge";
import { loadC4ModelWithStatus, type C4ModelLoadResult } from "@/lib/structurizr-api";

export default function OpsImpactPage() {
  const [loadResult, setLoadResult] = useState<C4ModelLoadResult | null>(null);

  useEffect(() => {
    loadC4ModelWithStatus().then(setLoadResult);
  }, []);

  const impactRows = useMemo(() => {
    if (!loadResult) return [];
    const elementsById = new Map(loadResult.model.elements.map((element) => [element.id, element]));
    return loadResult.model.relationships
      .map((relationship) => ({
        relationship,
        source: elementsById.get(relationship.sourceId),
        target: elementsById.get(relationship.targetId),
        score:
          (relationship.lifecycle === "deprecated" ? 3 : 0) +
          (relationship.documentation.length === 0 ? 2 : 0) +
          (relationship.protocol ? 1 : 0),
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 20);
  }, [loadResult]);

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Ops impact</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-50">Operational relationship map</h1>
          <p className="mt-5 text-lg leading-8 text-slate-400">
            A first operational view that ranks links needing attention: deprecated flows, undocumented dependencies,
            and technology/protocol boundaries.
          </p>
        </div>

        {!loadResult ? (
          <p className="mt-10 text-slate-500">Loading impact model...</p>
        ) : (
          <div className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
            <div className="grid grid-cols-[1.3fr_1.3fr_0.8fr_0.7fr] gap-4 border-b border-white/10 px-5 py-3 text-xs uppercase tracking-[0.16em] text-slate-500">
              <span>Flow</span>
              <span>Description</span>
              <span>Technology</span>
              <span>Status</span>
            </div>
            {impactRows.map(({ relationship, source, target }) => (
              <div key={relationship.id} className="grid grid-cols-[1.3fr_1.3fr_0.8fr_0.7fr] gap-4 border-b border-white/5 px-5 py-4 text-sm last:border-b-0">
                <div>
                  <p className="font-medium text-slate-100">{source?.name ?? relationship.sourceId}</p>
                  <p className="text-slate-500">to {target?.name ?? relationship.targetId}</p>
                </div>
                <p className="text-slate-400">{relationship.description ?? "No relationship description."}</p>
                <p className="text-slate-300">{relationship.protocol ?? relationship.technology ?? "n/a"}</p>
                <div className="flex flex-col items-start gap-2">
                  <LifecycleBadge lifecycle={relationship.lifecycle} />
                  {relationship.documentation.length === 0 ? (
                    <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-200">docs missing</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        <Link href="/" className="mt-8 inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-950">
          Back to architecture map
        </Link>
      </section>
    </AppShell>
  );
}
