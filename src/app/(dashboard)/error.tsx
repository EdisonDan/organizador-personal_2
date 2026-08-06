"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <div className="space-y-1">
        <p className="font-medium text-foreground">Algo salió mal cargando esta página</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Revisa que las variables de entorno de Supabase estén configuradas correctamente en
          .env.local.
        </p>
      </div>
      <button type="button" onClick={reset} className="btn-secondary mt-1">
        Intentar de nuevo
      </button>
    </div>
  );
}
