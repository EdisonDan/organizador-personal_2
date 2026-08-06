"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Flame, Trophy, Pencil, Archive, Trash2, Ban, ImageOff } from "lucide-react";
import Image from "next/image";
import { HabitIcon } from "@/components/habits/icon-picker";
import { ProgressRing } from "@/components/habits/progress-ring";
import { HeatmapCalendar } from "@/components/habits/heatmap-calendar";
import { HabitFormDialog } from "@/components/habits/habit-form-dialog";
import { HabitLogDialog } from "@/components/habits/habit-log-dialog";
import { calculateConsistency, calculateStreaks } from "@/lib/habits/streaks";
import { archiveHabit, deleteHabit } from "@/app/(dashboard)/habits/actions";
import type { Habit, HabitLog } from "@/lib/types";

export function HabitDetailClient({
  userId,
  habit,
  logs,
}: {
  userId: string;
  habit: Habit;
  logs: HabitLog[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [logDialogDate, setLogDialogDate] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isNegative = habit.type === "negative";
  const { current, longest } = calculateStreaks(habit, logs);
  const consistency = calculateConsistency(habit, logs, 30);

  const recentLogs = [...logs]
    .filter((l) => l.note || l.photo_url || l.completed)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 15);

  async function handleArchive() {
    setBusy(true);
    await archiveHabit(habit.id, !habit.archived);
    setBusy(false);
    router.push("/habits");
  }

  async function handleDelete() {
    if (!confirm(`¿Borrar "${habit.name}" y todo su historial? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    await deleteHabit(habit.id);
    router.push("/habits");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl"
            style={{ backgroundColor: `${habit.color}22` }}
          >
            {habit.image_url ? (
              <Image src={habit.image_url} alt="" width={48} height={48} className="h-full w-full object-cover" />
            ) : (
              <HabitIcon name={habit.icon} className="h-6 w-6" style={{ color: habit.color }} />
            )}
          </span>
          <div>
            <h1 className="flex items-center gap-1.5 text-xl font-semibold tracking-tight">
              {habit.name}
              {isNegative && <Ban className="h-4 w-4 text-destructive" />}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isNegative ? "Hábito a evitar" : "Hábito"}
              {habit.category ? ` · ${habit.category}` : ""}
            </p>
          </div>
        </div>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
            aria-label="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleArchive}
            disabled={busy}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-60"
            aria-label="Archivar"
          >
            <Archive className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-destructive hover:bg-destructive/10 disabled:opacity-60"
            aria-label="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Flame} label="Racha actual" value={current} accent="text-gold" />
        <StatCard icon={Trophy} label="Racha más larga" value={longest} accent="text-primary" />
        <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-card p-4">
          <ProgressRing percent={consistency} size={40} strokeWidth={4} />
          <span className="tabular-stat text-xs text-muted-foreground">30 días</span>
        </div>
      </div>

      <HeatmapCalendar habits={[habit]} logs={logs} onDayClick={(dateKey) => setLogDialogDate(dateKey)} />

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Registros con nota o foto</h2>
          <button
            type="button"
            onClick={() => setLogDialogDate(new Date().toISOString().slice(0, 10))}
            className="text-xs font-medium text-primary hover:underline"
          >
            Agregar registro
          </button>
        </div>

        {recentLogs.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <ImageOff className="h-4 w-4" />
            Todavía no hay notas o fotos guardadas.
          </p>
        ) : (
          <ul className="space-y-3">
            {recentLogs.map((log) => (
              <li key={log.id}>
                <button
                  type="button"
                  onClick={() => setLogDialogDate(log.date)}
                  className="flex w-full items-start gap-3 rounded-xl border border-border p-3 text-left hover:bg-muted"
                >
                  {log.photo_url && (
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                      <Image src={log.photo_url} alt="" fill className="object-cover" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {new Date(log.date + "T00:00:00").toLocaleDateString("es-EC", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      · {log.completed ? (isNegative ? "Evitado" : "Hecho") : isNegative ? "No evitado" : "No hecho"}
                    </p>
                    {log.note && <p className="mt-0.5 truncate text-sm text-foreground">{log.note}</p>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <HabitFormDialog open={editOpen} onClose={() => setEditOpen(false)} userId={userId} habit={habit} />

      {logDialogDate && (
        <HabitLogDialog
          open
          onClose={() => setLogDialogDate(null)}
          userId={userId}
          habit={habit}
          date={logDialogDate}
          existingLog={logs.find((l) => l.date === logDialogDate)}
        />
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-card p-4 text-center">
      <Icon className={`h-4 w-4 ${accent}`} />
      <span className="tabular-stat text-lg font-semibold text-foreground">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}
