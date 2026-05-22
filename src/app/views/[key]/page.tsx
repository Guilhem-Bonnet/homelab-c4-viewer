"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { GraphCanvas } from "@/components/GraphCanvas";
import { loadC4Model } from "@/lib/structurizr-api";
import { useEffect, useState } from "react";
import type { NormalizedC4Model } from "@/types/c4";

export default function ViewPage() {
  const [model, setModel] = useState<NormalizedC4Model | null>(null);
  const params = useParams<{ key: string }>();

  useEffect(() => {
    loadC4Model().then(setModel);
  }, []);

  if (!model) {
    return (
      <AppShell>
        <section className="mx-auto max-w-7xl px-6 py-16 text-slate-400">Loading C4 view...</section>
      </AppShell>
    );
  }

  const { key } = params;
  const view = model.views.find((candidate) => candidate.key === key);
  if (!view) {
    return (
      <AppShell>
        <section className="mx-auto max-w-7xl px-6 py-16 text-slate-400">View not found.</section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <GraphCanvas view={view} />
    </AppShell>
  );
}
