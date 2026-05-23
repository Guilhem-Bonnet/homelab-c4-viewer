"use client";

import { C4ErrorFallback } from "@/components/C4ErrorFallback";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <C4ErrorFallback
      eyebrow="Erreur client C4"
      title="La vue a planté côté navigateur."
      description="Le viewer tente maintenant une récupération contrôlée. Les erreurs de chunks Next.js périmés déclenchent un reload; les autres erreurs relancent la vue sans bloquer la navigation."
      error={error}
      reset={reset}
    />
  );
}
