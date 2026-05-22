import type { ReactNode } from "react";
import { Network } from "lucide-react";
import Link from "next/link";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold text-slate-100">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-400/15 text-sky-300">
              <Network size={18} />
            </span>
            HomeLab C4 Viewer
          </Link>
          <nav className="flex items-center gap-2 text-sm text-slate-400">
            <Link className="rounded-lg px-3 py-2 hover:bg-white/5 hover:text-slate-100" href="/docs">Docs</Link>
            <Link className="rounded-lg px-3 py-2 hover:bg-white/5 hover:text-slate-100" href="/ops">Ops impact</Link>
            <a className="rounded-lg px-3 py-2 hover:bg-white/5 hover:text-slate-100" href="/workspace/">Structurizr</a>
          </nav>
        </div>
      </header>
      {children}
    </main>
  );
}
