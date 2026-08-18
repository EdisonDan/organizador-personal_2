"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, Palette, Heart, CheckCircle2, MoreVertical, Pencil, Trash2, Archive } from "lucide-react";
import { completePromise, setPromiseStatus, deletePromise } from "@/app/(dashboard)/promises/actions";
import type { Promise_ } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_META = {
  yearly: { label: "Del año", icon: Sparkles, accent: "text-gold" },
  change: { label: "De cambio", icon: RefreshCw, accent: "text-primary" },
  creative: { label: "Creativa", icon: Palette, accent: "text-[#DB4C77]" },
  personal: { label: "Personal", icon: Heart, accent: "text-[#6D5EF5]" },
} as const;

export function PromiseCard({ promise, onEdit }: { promise: Promise_; onEdit: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const meta = TYPE_META[promise.type];
  const Icon = meta.icon;

  async function handleComplete() {
    setBusy(true);
    await completePromise(promise.id).catch(() => {});
    setBusy(false);
    setConfirming(false);
  }

  async function handleDelete() {
    if (!confirm(`¿Borrar "${promise.title}"?`)) return;
    setBusy(true);
    await deletePromise(promise.id);
    setBusy(false);
  }

  return (
    <div className="relative rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted", meta.accent)}>
          <Icon className="h-4 w-4" />
        </span>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Más opciones"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <button type="button" aria-label="Cerrar menú" className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg">
                <MenuItem icon={Pencil} label="Editar" onClick={onEdit} />
                {promise.status !== "archived" ? (
                  <MenuItem
                    icon={Archive}
                    label={promise.status === "paused" ? "Reactivar" : "Pausar"}
                    onClick={() => setPromiseStatus(promise.id, promise.status === "paused" ? "active" : "paused")}
                  />
                ) : (
                  <MenuItem icon={Archive} label="Reactivar" onClick={() => setPromiseStatus(promise.id, "active")} />
                )}
                <MenuItem icon={Trash2} label="Eliminar" onClick={handleDelete} danger />
              </div>
            </>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm font-medium text-foreground">{promise.title}</p>
      {promise.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{promise.description}</p>}

      {promise.status === "completed" ? (
        <p className="tabular-stat mt-3 flex items-center gap-1.5 text-xs font-medium text-primary">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Cumplida {promise.completed_date && `el ${promise.completed_date}`}
        </p>
      ) : confirming ? (
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => setConfirming(false)} className="btn-secondary flex-1 justify-center text-xs">
            Cancelar
          </button>
          <button type="button" onClick={handleComplete} disabled={busy} className="btn-primary flex-1 justify-center text-xs">
            Confirmar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={promise.status === "paused" || promise.status === "archived"}
          className="btn-secondary mt-3 w-full justify-center text-xs disabled:opacity-50"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Cumplida
        </button>
      )}

      {promise.status === "paused" && (
        <p className="mt-2 text-center text-[10px] text-muted-foreground">En pausa</p>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted",
        danger ? "text-destructive" : "text-foreground"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
