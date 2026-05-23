"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("C4 viewer route error", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-slate-100">
      <section className="max-w-lg rounded-3xl border border-red-400/20 bg-red-400/10 p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-200">Erreur client C4</p>
        <h1 className="mt-3 text-2xl font-semibold">La vue a planté côté navigateur.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Le viewer peut récupérer après un changement d&apos;image ou un chunk Next.js périmé. Essaie d&apos;abord de recharger la vue.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-sky-300/30 bg-sky-400/10 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-400/15"
          >
            Réessayer
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5"
          >
            Recharger la page
          </button>
        </div>
      </section>
    </main>
  );
}
