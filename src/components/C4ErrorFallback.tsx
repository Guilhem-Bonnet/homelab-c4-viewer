"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";

const errorRetryStorageKey = "c4-viewer:error-retry";
const retryWindowMs = 60_000;
const maxAutoRetries = 2;

type StoredRetry = {
  fingerprint: string;
  count: number;
  at: number;
};

function errorFingerprint(error?: Error & { digest?: string }): string {
  if (!error) return "global-error";
  return [error.name, error.message, error.digest].filter(Boolean).join(":") || "unknown-error";
}

function safeReadRetry(): StoredRetry | null {
  try {
    const raw = window.sessionStorage.getItem(errorRetryStorageKey);
    return raw ? (JSON.parse(raw) as StoredRetry) : null;
  } catch {
    return null;
  }
}

function safeWriteRetry(value: StoredRetry) {
  try {
    window.sessionStorage.setItem(errorRetryStorageKey, JSON.stringify(value));
  } catch {
    // Recovery still works without sessionStorage; it just won't persist retry counts.
  }
}

export function isRecoverableAssetError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /ChunkLoadError|Loading chunk|dynamically imported module|Failed to fetch|_next\/static|module script failed|CSS chunk/i.test(message);
}

export function C4ErrorFallback({
  eyebrow,
  title,
  description,
  error,
  reset,
}: {
  eyebrow: string;
  title: string;
  description: string;
  error?: Error & { digest?: string };
  reset: () => void;
}) {
  const fingerprint = useMemo(() => errorFingerprint(error), [error]);

  useEffect(() => {
    console.error("C4 viewer client error", error);

    const now = Date.now();
    const previous = safeReadRetry();
    const sameErrorInWindow = previous?.fingerprint === fingerprint && now - previous.at < retryWindowMs;
    const count = sameErrorInWindow ? previous.count + 1 : 1;
    safeWriteRetry({ fingerprint, count, at: now });

    if (count > maxAutoRetries) return;

    const timer = window.setTimeout(() => {
      if (isRecoverableAssetError(error)) {
        window.location.reload();
        return;
      }
      reset();
    }, 600);

    return () => window.clearTimeout(timer);
  }, [error, fingerprint, reset]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-slate-100">
      <section className="max-w-xl rounded-3xl border border-red-400/20 bg-red-400/10 p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-200">{eyebrow}</p>
        <h1 className="mt-3 text-2xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
        <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
          Récupération automatique tentée. Si le message reste affiché, recharge la page pour récupérer les chunks ou données C4 les plus récents.
        </p>
        {error?.message ? (
          <details className="mt-4 rounded-xl border border-white/10 bg-slate-950/50 p-3 text-xs text-slate-400">
            <summary className="cursor-pointer font-semibold text-slate-300">Détail technique</summary>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words">{error.message}</pre>
          </details>
        ) : null}
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
          <Link
            href="/"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5"
          >
            Retour overview
          </Link>
        </div>
      </section>
    </main>
  );
}
