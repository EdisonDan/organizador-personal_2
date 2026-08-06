"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, ListChecks, LayoutGrid, GripVertical, Table2 } from "lucide-react";
import { DailyChecklistItem } from "@/components/habits/daily-checklist-item";
import { HabitCard } from "@/components/habits/habit-card";
import { HabitFormDialog } from "@/components/habits/habit-form-dialog";
import { HabitLogDialog } from "@/components/habits/habit-log-dialog";
import { HeatmapCalendar } from "@/components/habits/heatmap-calendar";
import { WeeklySummary } from "@/components/habits/weekly-summary";
import { HabitsSpreadsheetView } from "@/components/habits/habits-spreadsheet-view";
import { isDueOnDate, toDateKey } from "@/lib/habits/frequency";
import { reorderHabits } from "@/app/(dashboard)/habits/actions";
import type { Habit, HabitLog } from "@/lib/types";

export function HabitsClient({
  userId,
  habits,
  logs,
}: {
  userId: string;
  habits: Habit[];
  logs: HabitLog[];
}) {
  const [tab, setTab] = useState<"hoy" | "todos" | "cuadricula">("hoy");
  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);
  const [logDialog, setLogDialog] = useState<{ habit: Habit; date: string } | null>(null);
  const [orderedHabits, setOrderedHabits] = useState(habits);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Si llegan hábitos nuevos del servidor (crear/borrar/revalidate), se
  // sincroniza el orden local sin perder lo que el usuario acomodó a mano.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOrderedHabits(habits), [habits]);

  const today = new Date();
  const todayKey = toDateKey(today);

  const logsByHabit = useMemo(() => {
    const map = new Map<string, HabitLog[]>();
    for (const log of logs) {
      if (!map.has(log.habit_id)) map.set(log.habit_id, []);
      map.get(log.habit_id)!.push(log);
    }
    return map;
  }, [logs]);

  function openCreate() {
    setEditingHabit(undefined);
    setFormOpen(true);
  }

  function openEdit(habit: Habit) {
    setEditingHabit(habit);
    setFormOpen(true);
  }

  function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) return;
    const next = [...orderedHabits];
    const fromIndex = next.findIndex((h) => h.id === draggingId);
    const toIndex = next.findIndex((h) => h.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setOrderedHabits(next);
    setDraggingId(null);
    reorderHabits(next.map((h) => h.id)).catch(() => {});
  }

  if (habits.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Plus className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Todavía no tienes hábitos</p>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              Crea el primero, positivo o negativo, y empieza a construir tu racha desde hoy.
            </p>
          </div>
          <button type="button" onClick={openCreate} className="btn-primary mt-1">
            <Plus className="h-4 w-4" />
            Crear hábito
          </button>
        </div>
        <HabitFormDialog open={formOpen} onClose={() => setFormOpen(false)} userId={userId} habit={editingHabit} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-full border border-border bg-muted p-0.5">
          <TabButton active={tab === "hoy"} onClick={() => setTab("hoy")} icon={ListChecks} label="Hoy" />
          <TabButton active={tab === "todos"} onClick={() => setTab("todos")} icon={LayoutGrid} label="Todos" />
          <TabButton active={tab === "cuadricula"} onClick={() => setTab("cuadricula")} icon={Table2} label="Cuadrícula" />
        </div>
        <button type="button" onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" />
          Nuevo hábito
        </button>
      </div>

      {tab === "hoy" ? (
        <div className="space-y-2">
          {orderedHabits.map((habit) => {
            const habitLogs = logsByHabit.get(habit.id) ?? [];
            const todayLog = habitLogs.find((l) => l.date === todayKey);
            const due = isDueOnDate(habit, today);
            return (
              <DailyChecklistItem
                key={habit.id}
                habit={habit}
                log={todayLog}
                dateKey={todayKey}
                due={due}
                onOpenDetail={() => setLogDialog({ habit, date: todayKey })}
              />
            );
          })}
        </div>
      ) : tab === "todos" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {orderedHabits.map((habit) => (
            <div
              key={habit.id}
              draggable
              onDragStart={() => setDraggingId(habit.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(habit.id)}
              className="group relative"
            >
              <span className="absolute -left-1 top-1/2 hidden -translate-y-1/2 cursor-grab text-muted-foreground/50 group-hover:block">
                <GripVertical className="h-4 w-4" />
              </span>
              <HabitCard habit={habit} logs={logsByHabit.get(habit.id) ?? []} onEdit={() => openEdit(habit)} />
            </div>
          ))}
        </div>
      ) : (
        <HabitsSpreadsheetView habits={orderedHabits} logs={logs} />
      )}

      {tab !== "cuadricula" && (
        <>
          <WeeklySummary habits={habits} logs={logs} />
          <HeatmapCalendar habits={habits} logs={logs} />
        </>
      )}

      <HabitFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        userId={userId}
        habit={editingHabit}
      />

      {logDialog && (
        <HabitLogDialog
          open
          onClose={() => setLogDialog(null)}
          userId={userId}
          habit={logDialog.habit}
          date={logDialog.date}
          existingLog={logsByHabit.get(logDialog.habit.id)?.find((l) => l.date === logDialog.date)}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
