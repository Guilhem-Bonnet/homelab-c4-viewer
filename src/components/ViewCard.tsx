import type { C4View } from "@/types/c4";
import { LifecycleBadge } from "./LifecycleBadge";
import Link from "next/link";

export function ViewCard({ view }: { view: C4View }) {
  return (
    <Link href={`/views/${view.key}`} className="group rounded-3xl border border-white/10 bg-slate-900/55 p-6 shadow-2xl shadow-black/20 transition hover:-translate-y-1 hover:border-sky-400/40 hover:bg-slate-900/80">
      <div className="mb-5 flex items-center justify-between">
        <LifecycleBadge lifecycle={view.lifecycle} />
        <span className="text-xs text-slate-500">{view.elements.length} nodes · {view.relationships.length} links</span>
      </div>
      <h2 className="text-xl font-semibold tracking-tight text-slate-100">{view.title}</h2>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{view.description ?? "C4 view generated from Structurizr."}</p>
      <span className="mt-6 inline-flex text-sm font-medium text-sky-300 group-hover:text-sky-200">Open interactive view</span>
    </Link>
  );
}
