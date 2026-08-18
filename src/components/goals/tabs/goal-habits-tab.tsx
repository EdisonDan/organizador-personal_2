"use client";

import { useState } from "react";
import { Plus, X, Flame } from "lucide-react";
import { HabitIcon } from "@/components/habits/icon-picker";
import { ProgressRing } from "@/components/habits/progress-ring";
import { calculateConsistency, calculateStreaks } from "@/lib/habits/streaks";
import { linkHabit, unlinkHabit } from "@/app/(dashboard)/goals/actions";
import type { Goal, GoalHabitLink, Habit, HabitLog } from "@/lib/types";

export function GoalHabitsTab({
  goal,
  habitLinks,
  allHabits,
  habitLogsByHabit,
}: {
  goal: Goal;
  habitLinks: GoalHabitLink[];
  allHabits: Habit[];
  habitLogsByHabit: Map<string, HabitLog[]>;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const linkedHabitIds = new Set(habitLinks.map((l) => l.habit_id));
  const linkedHabits = allHabits.filter((h) => linkedHabitIds.has(h.id));
  const availableHabits = allHabits.filter((h) => !linkedHabitIds.has(h.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Hábitos vinculados</p>
        <div className="relative">
          <button type="button" onClick={() => setShowPicker((v) => !v)} className="btn-secondary text-xs">
            <Plus className="h-3.5 w-3.5" />
            Vincular hábito
          </button>
          {showPicker && (
            <>
              <button type="button" className="fixed inset-0 z-40" aria-label="Cerrar" onClick={() => setShowPicker(false)} />
              <div className="absolute right-0 z-50 mt-1 max-h-48 w-56 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-lg">
                {availableHabits.length === 0 ? (
                  <p className="p-3 text-xs text-muted-foreground">No hay hábitos disponibles.</p>
                ) : (
                  availableHabits.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => {
                        linkHabit(goal.id, h.id).catch(() => {});
                        setShowPicker(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-muted"
                    >
                      <HabitIcon name={h.icon} className="h-3.5 w-3.5" style={{ color: h.color }} />
                      {h.name}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {linkedHabits.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Vincula un hábito existente (ej. &quot;Estudiar Python 25 min diarios&quot;) para ver su constancia reflejada aquí.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {linkedHabits.map((habit) => {
            const logs = habitLogsByHabit.get(habit.id) ?? [];
            const consistency = calculateConsistency(habit, logs, 7);
            const { current } = calculateStreaks(habit, logs);
            const link = habitLinks.find((l) => l.habit_id === habit.id);
            return (
              <div key={habit.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
                <ProgressRing percent={consistency} size={40} strokeWidth={4}>
                  <HabitIcon name={habit.icon} className="h-4 w-4" style={{ color: habit.color }} />
                </ProgressRing>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{habit.name}</p>
                  <p className="tabular-stat flex items-center gap-1 text-xs text-muted-foreground">
                    <Flame className="h-3 w-3 text-gold" />
                    {current} días · {consistency}% esta semana
                  </p>
                </div>
                {link && (
                  <button
                    type="button"
                    onClick={() => unlinkHabit(link.id, goal.id).catch(() => {})}
                    aria-label="Desvincular"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
