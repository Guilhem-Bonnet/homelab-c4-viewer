import { AppShell } from "@/components/AppShell";

export default function DocsPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">Documentation</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-50">C4 documentation hub</h1>
        <p className="mt-5 text-lg leading-8 text-slate-400">
          This page is reserved for as-code architecture docs, human notes, and clearly marked AI-generated sections.
          Private homelab documentation is intentionally not stored in this public repository.
        </p>
      </section>
    </AppShell>
  );
}
