"use client";

import { useEffect } from "react";

const reloadStorageKey = "c4-viewer:chunk-reload-at";

function isRecoverableAssetError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /ChunkLoadError|Loading chunk|dynamically imported module|Failed to fetch|_next\/static/i.test(message);
}

function reloadOnce() {
  const lastReload = Number(window.sessionStorage.getItem(reloadStorageKey) ?? 0);
  const now = Date.now();
  if (now - lastReload < 30_000) return;
  window.sessionStorage.setItem(reloadStorageKey, String(now));
  window.location.reload();
}

export function ClientErrorRecovery() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (isRecoverableAssetError(event.error ?? event.message)) reloadOnce();
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isRecoverableAssetError(event.reason)) reloadOnce();
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
