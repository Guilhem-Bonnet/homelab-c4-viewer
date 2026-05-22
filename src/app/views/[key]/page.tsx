import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { GraphCanvas } from "@/components/GraphCanvas";
import { loadC4Model } from "@/lib/structurizr-api";

export default async function ViewPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const model = await loadC4Model();
  const view = model.views.find((candidate) => candidate.key === key);
  if (!view) notFound();

  return (
    <AppShell>
      <GraphCanvas view={view} />
    </AppShell>
  );
}
