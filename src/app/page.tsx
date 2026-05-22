"use client";

import { AppShell } from "@/components/AppShell";
import { ViewCard } from "@/components/ViewCard";
import { loadC4ModelWithStatus, type C4ModelLoadResult } from "@/lib/structurizr-api";
import { LifecycleBadge } from "@/components/LifecycleBadge";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [loadResult, setLoadResult] = useState<C4ModelLoadResult | null>(null);

  useEffect(() => {
    loadC4ModelWithStatus().then(setLoadResult);
  }, []);

  if (!loadResult) {
    return (
      <AppShell>
        <section className="mx-auto max-w-7xl px-6 py-16 text-slate-400">Loading C4 workspace...</section>
      </AppShell>
    );
  }

  const { model } = loadResult;
  const live = model.versions.find((version) => version.lifecycle === "live") ?? model.versions[0];

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-3xl">
          <div className="mb-5 flex items-center gap-3">
            {live ? <LifecycleBadge lifecycle={live.lifecycle} /> : null}
            <span className="text-sm text-slate-500">Structurizr engine · C4 registry overlay</span>
            <span className={`rounded-full border px-2.5 py-1 text-xs ${loadResult.source === "live" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-amber-400/30 bg-amber-400/10 text-amber-200"}`}>
              {loadResult.source === "live" ? "Live workspace" : "Fixture fallback"}
            </span>
          </div>
          <h1 className="text-5xl font-semibold tracking-[-0.06em] text-slate-50 md:text-7xl">
            HomeLab C4 Architecture
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-400">
            A product-grade architecture map built from Structurizr JSON, enriched with as-code metadata,
            version lifecycles, relationship details, and documentation provenance.
          </p>
          {loadResult.error ? (
            <p className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
              Live workspace unavailable from {loadResult.endpoint}; showing the public-safe fixture instead.
            </p>
          ) : null}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-4">
          <Metric label="Views" value={model.views.length} />
          <Metric label="Elements" value={model.elements.length} />
          <Metric label="Relationships" value={model.relationships.length} />
          <Metric label="Versions" value={model.versions.length} />
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {model.views.map((view) => <ViewCard key={view.key} view={view} />)}
        </div>
      </section>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-3xl font-semibold text-slate-100">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}
