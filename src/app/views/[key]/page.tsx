"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { GraphCanvas } from "@/components/GraphCanvas";
import { loadC4ModelWithStatus, type C4ModelLoadResult } from "@/lib/structurizr-api";
import { useEffect, useState } from "react";

export default function ViewPage() {
  const [loadResult, setLoadResult] = useState<C4ModelLoadResult | null>(null);
  const params = useParams<{ key: string }>();

  useEffect(() => {
    loadC4ModelWithStatus().then(setLoadResult);
  }, []);

  if (!loadResult) {
    return (
      <AppShell>
        <section className="mx-auto max-w-7xl px-6 py-16 text-slate-400">Loading C4 view...</section>
      </AppShell>
    );
  }

  const { key } = params;
  const view = loadResult.model.views.find((candidate) => candidate.key === key);
  if (!view) {
    return (
      <AppShell>
        <section className="mx-auto max-w-7xl px-6 py-16 text-slate-400">View not found.</section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <GraphCanvas
        view={view}
        allViews={loadResult.model.views}
        loadSource={loadResult.source}
        generatedAt={loadResult.model.metadata?.generatedAt}
      />
    </AppShell>
  );
}
