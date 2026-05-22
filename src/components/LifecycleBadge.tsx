import type { C4Lifecycle } from "@/types/c4";
import { lifecycleClass } from "@/lib/view-model";

export function LifecycleBadge({ lifecycle }: { lifecycle: C4Lifecycle }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${lifecycleClass(lifecycle)}`}>
      {lifecycle}
    </span>
  );
}
