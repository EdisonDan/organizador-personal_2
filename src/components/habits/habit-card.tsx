"use client";

import { useState } from "react";
import Link from "next/link";
import { Flame, Ban, MoreVertical, Pencil, Archive, Trash2 } from "lucide-react";
import { HabitIcon } from "@/components/habits/icon-picker";
import { ProgressRing } from "@/components/habits/progress-ring";
import { calculateConsistency, calculateStreaks } from "@/lib/habits/streaks";
import { archiveHabit, deleteHabit } from "@/app/(dashboard)/habits/actions";
import type { Habit, HabitLog } from "@/lib/types";

export function HabitCard({
  habit,
  logs,
  onEdit,
}: {
  habit: Habit;
  logs: HabitLog[];
  onEdit: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const isNegative = habit.type === "negative";

  const consistency = calculateConsistency(habit, logs, 30);
  const { current } = calculateStreaks(habit, logs);

  async function handleArchive() {
    setBusy(true);
    await archiveHabit(habit.id, true);
    setBusy(false);
  }

  async function handleDelete() {
    if (!confirm(`¿Borrar "${habit.name}" y todo su historial? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    await deleteHabit(habit.id);
    setBusy(false);
  }

  return (
    <div className="relative rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <Link href={`/habits/${habit.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <ProgressRing percent={consistency} size={44} strokeWidth={4}>
            {habit.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={habit.image_url} alt="" className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <HabitIcon name={habit.icon} className="h-4 w-4" style={{ color: habit.color }} />
            )}
          </ProgressRing>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{habit.name}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              {isNegative ? <Ban className="h-3 w-3" /> : null}
              {habit.category || (isNegative ? "A evitar" : "Hábito")}
            </p>
          </div>
        </Link>

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
              <button
                type="button"
                aria-label="Cerrar menú"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg">
                <MenuItem icon={Pencil} label="Editar" onClick={onEdit} />
                <MenuItem icon={Archive} label="Archivar" onClick={handleArchive} disabled={busy} />
                <MenuItem icon={Trash2} label="Eliminar" onClick={handleDelete} disabled={busy} danger />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="tabular-stat mt-3 flex items-center gap-1.5 text-sm">
        <Flame className={`h-3.5 w-3.5 ${current > 0 ? "text-gold" : "text-muted-foreground"}`} />
        <span className="font-medium text-foreground">{current}</span>
        <span className="text-xs text-muted-foreground">
          {current === 1 ? "día seguido" : "días seguidos"}
        </span>
      </div>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-60 ${
        danger ? "text-destructive" : "text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
