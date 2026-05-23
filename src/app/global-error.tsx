"use client";

import { C4ErrorFallback } from "@/components/C4ErrorFallback";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body>
        <C4ErrorFallback
          eyebrow="Erreur globale C4"
          title="Le viewer a rencontré une erreur."
          description="Cette page remplace le message générique Next.js et tente une récupération automatique limitée avant de demander une action manuelle."
          error={error}
          reset={reset}
        />
      </body>
    </html>
  );
}
