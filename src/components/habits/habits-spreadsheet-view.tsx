"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Check, Ban } from "lucide-react";
import { HabitIcon } from "@/components/habits/icon-picker";
import { ProgressRing } from "@/components/habits/progress-ring";
import { toggleHabitLog } from "@/app/(dashboard)/habits/actions";
import { isDueOnDate, toDateKey } from "@/lib/habits/frequency";
import { cn } from "@/lib/utils";
import type { Habit, HabitLog } from "@/lib/types";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS = ["D", "L", "M", "M", "J", "V", "S"];

export function HabitsSpreadsheetView({ habits, logs }: { habits: Habit[]; logs: HabitLog[] }) {
  const [offset, setOffset] = useState(0);
  // Copia local para poder marcar/desmarcar al instante sin esperar al servidor.
  const [localLogs, setLocalLogs] = useState(logs);

  const today = useMemo(() => new Date(), []);
  const view = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const year = view.getFullYear();
  const month = view.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const completedSet = useMemo(() => {
    const set = new Set<string>(); // `${habitId}:${dateKey}`
    for (const log of localLogs) {
      if (log.completed) set.add(`${log.habit_id}:${log.date}`);
    }
    return set;
  }, [localLogs]);

  const { monthlyPct, totalCompleted } = useMemo(() => {
    let due = 0;
    let done = 0;
    for (const habit of habits) {
      for (const day of days) {
        const date = new Date(year, month, day);
        if (date > today) continue;
        if (new Date(habit.created_at) > date) continue;
        if (!isDueOnDate(habit, date)) continue;
        due++;
        if (completedSet.has(`${habit.id}:${toDateKey(date)}`)) done++;
      }
    }
    return { monthlyPct: due === 0 ? 0 : Math.round((done / due) * 100), totalCompleted: done };
  }, [habits, days, year, month, completedSet, today]);

  function toggleCell(habit: Habit, day: number) {
    const date = new Date(year, month, day);
    if (date > today) return;
    const dateKey = toDateKey(date);
    const key = `${habit.id}:${dateKey}`;
    const nowCompleted = !completedSet.has(key);

    setLocalLogs((prev) => {
      const existingIndex = prev.findIndex((l) => l.habit_id === habit.id && l.date === dateKey);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = { ...next[existingIndex], completed: nowCompleted };
        return next;
      }
      return [
        ...prev,
        {
          id: `local-${key}`,
          habit_id: habit.id,
          user_id: habit.user_id,
          date: dateKey,
          completed: nowCompleted,
          value: null,
          note: null,
          photo_url: null,
          created_at: new Date().toISOString(),
        },
      ];
    });

    toggleHabitLog(habit.id, dateKey, nowCompleted, habit.goal_value ?? null).catch(() => {});
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOffset((o) => o - 1)}
            aria-label="Mes anterior"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="w-36 text-center text-sm font-medium text-foreground">
            {MESES[month]} {year}
          </p>
          <button
            type="button"
            onClick={() => setOffset((o) => o + 1)}
            aria-label="Mes siguiente"
            disabled={offset >= 0}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ProgressRing percent={monthlyPct} size={38} strokeWidth={4} />
            <div>
              <p className="tabular-stat text-sm font-semibold text-foreground">{monthlyPct}%</p>
              <p className="text-[10px] text-muted-foreground">del mes</p>
            </div>
          </div>
          <div className="text-center">
            <p className="tabular-stat text-lg font-semibold text-foreground">{totalCompleted}</p>
            <p className="text-[10px] text-muted-foreground">completados</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 min-w-40 border-b border-border bg-card p-2 text-left font-medium text-muted-foreground">
                Hábito
              </th>
              {days.map((day) => (
                <th key={day} className="border-b border-border p-1 text-center font-normal text-muted-foreground">
                  <div>{DIAS[new Date(year, month, day).getDay()]}</div>
                  <div className="tabular-stat">{day}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => (
              <tr key={habit.id} className="group">
                <td className="sticky left-0 z-10 border-b border-border bg-card p-2 group-hover:bg-muted">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: `${habit.color}22`, color: habit.color }}
                    >
                      <HabitIcon name={habit.icon} className="h-3.5 w-3.5" />
                    </span>
                    <span className="truncate text-foreground">{habit.name}</span>
                  </div>
                </td>
                {days.map((day) => {
                  const date = new Date(year, month, day);
                  const dateKey = toDateKey(date);
                  const due = isDueOnDate(habit, date) && new Date(habit.created_at) <= date;
                  const isFuture = date > today;
                  const done = completedSet.has(`${habit.id}:${dateKey}`);
                  return (
                    <td key={day} className="border-b border-border p-0.5 text-center">
                      <button
                        type="button"
                        disabled={!due || isFuture}
                        onClick={() => toggleCell(habit, day)}
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded border transition-colors",
                          !due || isFuture
                            ? "border-transparent"
                            : done
                              ? "border-transparent text-white"
                              : "border-border hover:bg-muted"
                        )}
                        style={done && due && !isFuture ? { backgroundColor: habit.color } : undefined}
                      >
                        {done && due && !isFuture && (habit.type === "negative" ? <Ban className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
