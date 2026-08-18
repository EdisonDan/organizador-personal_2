"use client";

import { useMemo, useState } from "react";
import { Plus, Archive } from "lucide-react";
import { PromiseCard } from "@/components/promises/promise-card";
import { PromiseFormDialog } from "@/components/promises/promise-form-dialog";
import type { Habit, Promise_, PromiseType } from "@/lib/types";

const GROUPS: { type: PromiseType; label: string }[] = [
  { type: "yearly", label: "Del año" },
  { type: "change", label: "De cambio" },
  { type: "creative", label: "Creativas" },
  { type: "personal", label: "Personales" },
];

export function PromisesClient({ promises, habits }: { promises: Promise_[]; habits: Habit[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Promise_ | undefined>(undefined);
  const [showArchived, setShowArchived] = useState(false);

  const visible = useMemo(
    () => promises.filter((p) => (showArchived ? true : p.status !== "archived")),
    [promises, showArchived]
  );

  const byType = useMemo(() => {
    const map = new Map<PromiseType, Promise_[]>();
    for (const p of visible) {
      if (!map.has(p.type)) map.set(p.type, []);
      map.get(p.type)!.push(p);
    }
    return map;
  }, [visible]);

  function openCreate() {
    setEditing(undefined);
    setShowForm(true);
  }

  function openEdit(p: Promise_) {
    setEditing(p);
    setShowForm(true);
  }

  if (promises.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Plus className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Todavía no tienes promesas</p>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              Del año, de cambio, creativas o personales — compromisos que quieres cumplirte a ti mismo.
            </p>
          </div>
          <button type="button" onClick={openCreate} className="btn-primary mt-1">
            <Plus className="h-4 w-4" />
            Nueva promesa
          </button>
        </div>
        <PromiseFormDialog open={showForm} onClose={() => setShowForm(false)} habits={habits} promise={editing} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <Archive className="h-3.5 w-3.5" />
          {showArchived ? "Ocultar archivadas" : "Ver archivadas/pausadas"}
        </button>
        <button type="button" onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" />
          Nueva promesa
        </button>
      </div>

      {GROUPS.map((group) => {
        const items = byType.get(group.type) ?? [];
        if (items.length === 0) return null;
        return (
          <div key={group.type}>
            <h2 className="mb-2 text-sm font-semibold text-foreground">{group.label}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <PromiseCard key={p.id} promise={p} onEdit={() => openEdit(p)} />
              ))}
            </div>
          </div>
        );
      })}

      <PromiseFormDialog open={showForm} onClose={() => setShowForm(false)} habits={habits} promise={editing} />
    </div>
  );
}
