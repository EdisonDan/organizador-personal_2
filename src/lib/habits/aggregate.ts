import type { Habit, HabitLog } from "@/lib/types";
import { isDueOnDate, toDateKey } from "./frequency";

/**
 * Para cada día entre start y end (incluyente), calcula el % de hábitos
 * "due" ese día que se completaron. Se usa para el heatmap global y el
 * resumen semanal. Los hábitos "weekly_count" cuentan como due todos los
 * días (se evalúan por semana en otras vistas, pero aquí participan como
 * cualquier otro hábito diario para no dejar el heatmap vacío).
 */
export function computeDailyCompletion(
  habits: Habit[],
  logs: HabitLog[],
  start: Date,
  end: Date
): Map<string, { pct: number; due: number; done: number }> {
  const logsByHabit = new Map<string, Set<string>>();
  for (const log of logs) {
    if (!log.completed) continue;
    if (!logsByHabit.has(log.habit_id)) logsByHabit.set(log.habit_id, new Set());
    logsByHabit.get(log.habit_id)!.add(log.date);
  }

  const result = new Map<string, { pct: number; due: number; done: number }>();
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const endTime = new Date(end);
  endTime.setHours(0, 0, 0, 0);

  while (cursor <= endTime) {
    const key = toDateKey(cursor);
    let due = 0;
    let done = 0;
    for (const habit of habits) {
      if (new Date(habit.created_at) > cursor) continue; // el hábito no existía todavía
      if (!isDueOnDate(habit, cursor)) continue;
      due++;
      if (logsByHabit.get(habit.id)?.has(key)) done++;
    }
    result.set(key, { pct: due === 0 ? -1 : Math.round((done / due) * 100), due, done });
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}
