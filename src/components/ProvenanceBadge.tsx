import type { C4SourceKind } from "@/types/c4";

const label: Record<C4SourceKind, string> = {
  "as-code": "AsCode",
  human: "Human",
  ai: "AI",
  mixed: "Mixed",
};

export function ProvenanceBadge({ sourceKind, reviewed }: { sourceKind: C4SourceKind; reviewed?: boolean }) {
  const warning = sourceKind === "ai" && !reviewed;
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${warning ? "border-amber-400/40 bg-amber-400/10 text-amber-200" : "border-slate-600 bg-slate-800 text-slate-300"}`}>
      {label[sourceKind]}
      {warning ? " · unreviewed" : ""}
    </span>
  );
}
