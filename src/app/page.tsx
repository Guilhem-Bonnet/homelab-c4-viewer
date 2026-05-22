"use client";

import { AppShell } from "@/components/AppShell";
import { ViewCard } from "@/components/ViewCard";
import { loadC4Model } from "@/lib/structurizr-api";
import { LifecycleBadge } from "@/components/LifecycleBadge";
import { useEffect, useState } from "react";
import type { NormalizedC4Model } from "@/types/c4";

export default function HomePage() {
  const [model, setModel] = useState<NormalizedC4Model | null>(null);

  useEffect(() => {
    loadC4Model().then(setModel);
  }, []);

  if (!model) {
    return (
      <AppShell>
        <section className="mx-auto max-w-7xl px-6 py-16 text-slate-400">Loading C4 workspace...</section>
      </AppShell>
    );
  }

  const live = model.versions.find((version) => version.lifecycle === "live") ?? model.versions[0];

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-3xl">
          <div className="mb-5 flex items-center gap-3">
            {live ? <LifecycleBadge lifecycle={live.lifecycle} /> : null}
            <span className="text-sm text-slate-500">Structurizr engine · C4 registry overlay</span>
          </div>
          <h1 className="text-5xl font-semibold tracking-[-0.06em] text-slate-50 md:text-7xl">
            HomeLab C4 Architecture
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-400">
            A product-grade architecture map built from Structurizr JSON, enriched with as-code metadata,
            version lifecycles, relationship details, and documentation provenance.
          </p>
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
