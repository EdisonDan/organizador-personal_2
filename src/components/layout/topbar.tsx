"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, LogOut, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";

export function TopBar({
  displayName,
  streak,
  points,
}: {
  displayName: string;
  streak: number;
  points: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initial = displayName?.trim()?.[0]?.toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">
          Hola, <span className="font-medium text-foreground">{displayName}</span>
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div
          className="tabular-stat hidden items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground sm:flex"
          title="Racha global de constancia"
        >
          <Flame className="h-3.5 w-3.5 text-gold" />
          {streak}
        </div>
        <div
          className="tabular-stat hidden items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground sm:flex"
          title="Puntos"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {points}
        </div>

        <ThemeToggle />

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
            aria-label="Menú de usuario"
          >
            {initial}
          </button>
          {open && (
            <>
              <button
                type="button"
                aria-label="Cerrar menú"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setOpen(false)}
              />
              <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg">
                <button
                  type="button"
                  disabled={signingOut}
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-muted disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" />
                  {signingOut ? "Cerrando sesión..." : "Cerrar sesión"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
