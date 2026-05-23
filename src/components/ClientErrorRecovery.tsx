"use client";

import { useEffect } from "react";
import { isRecoverableAssetError } from "./C4ErrorFallback";

const reloadStorageKey = "c4-viewer:chunk-reload-at";

function reloadOnce() {
  let lastReload = 0;
  try {
    lastReload = Number(window.sessionStorage.getItem(reloadStorageKey) ?? 0);
  } catch {
    lastReload = 0;
  }
  const now = Date.now();
  if (now - lastReload < 30_000) return;
  try {
    window.sessionStorage.setItem(reloadStorageKey, String(now));
  } catch {
    // Ignore storage failures; the reload remains the recovery action.
  }
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
