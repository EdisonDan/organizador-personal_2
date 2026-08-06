import type { Habit, HabitLog } from "@/lib/types";
import { isDueOnDate, toDateKey, parseDateKey } from "./frequency";

export interface StreakResult {
  current: number;
  longest: number;
}

type HabitLike = Pick<Habit, "frequency_type" | "frequency_config">;
type LogLike = Pick<HabitLog, "date" | "completed">;

export const DEFAULT_WEEK_START = 1; // lunes

export function startOfWeek(date: Date, weekStartsOn = DEFAULT_WEEK_START): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function calculateStreaks(
  habit: HabitLike,
  logs: LogLike[],
  today: Date = new Date()
): StreakResult {
  const completedDates = new Set(logs.filter((l) => l.completed).map((l) => l.date));

  if (habit.frequency_type === "weekly_count") {
    return calculateWeeklyStreak(habit, completedDates, today);
  }
  return calculateDailyStreak(habit, completedDates, today);
}

function calculateDailyStreak(
  habit: HabitLike,
  completedDates: Set<string>,
  today: Date
): StreakResult {
  const todayKey = toDateKey(today);

  // Racha actual: caminar hacia atrás desde hoy. Si hoy todavía no se marcó,
  // eso no rompe la racha (se puede completar más tarde); cualquier otro día
  // "due" sin completar sí la rompe.
  let current = 0;
  const cursor = new Date(today);
  let isToday = true;

  for (;;) {
    const key = toDateKey(cursor);
    if (isDueOnDate(habit, cursor)) {
      const done = completedDates.has(key);
      if (done) {
        current++;
      } else if (!(isToday && key === todayKey)) {
        break;
      }
    }
    isToday = false;
    cursor.setDate(cursor.getDate() - 1);
    if (today.getTime() - cursor.getTime() > 1000 * 60 * 60 * 24 * 365 * 5) break;
  }

  // Racha más larga: recorrer desde el primer registro hasta hoy.
  const doneKeys = Array.from(completedDates).sort();
  let longest = current;

  if (doneKeys.length > 0) {
    let running = 0;
    const start = parseDateKey(doneKeys[0]);
    const cursor2 = new Date(start);
    while (cursor2 <= today) {
      const key = toDateKey(cursor2);
      if (isDueOnDate(habit, cursor2)) {
        if (completedDates.has(key)) {
          running++;
          longest = Math.max(longest, running);
        } else if (key !== todayKey) {
          running = 0;
        }
      }
      cursor2.setDate(cursor2.getDate() + 1);
    }
  }

  return { current, longest };
}

function calculateWeeklyStreak(
  habit: HabitLike,
  completedDates: Set<string>,
  today: Date
): StreakResult {
  const target = (habit.frequency_config?.days_per_week as number | undefined) ?? 3;

  const countsByWeek = new Map<string, number>();
  for (const dateKey of completedDates) {
    const weekKey = toDateKey(startOfWeek(parseDateKey(dateKey)));
    countsByWeek.set(weekKey, (countsByWeek.get(weekKey) ?? 0) + 1);
  }

  const thisWeekStart = startOfWeek(today);

  // Racha actual: semana por semana hacia atrás. La semana en curso, si no
  // llegó a la meta todavía, no rompe la racha (puede completarse esta semana).
  let current = 0;
  const cursorWeek = new Date(thisWeekStart);
  let isCurrentWeek = true;

  for (;;) {
    const count = countsByWeek.get(toDateKey(cursorWeek)) ?? 0;
    if (count >= target) {
      current++;
    } else if (!isCurrentWeek) {
      break;
    }
    isCurrentWeek = false;
    cursorWeek.setDate(cursorWeek.getDate() - 7);
    if (thisWeekStart.getTime() - cursorWeek.getTime() > 1000 * 60 * 60 * 24 * 365 * 5) break;
  }

  // Racha más larga: recorrer semanas con registros, detectando huecos.
  const weekKeys = Array.from(countsByWeek.keys()).sort();
  let longest = current;
  let running = 0;
  let prevWeek: Date | null = null;

  for (const key of weekKeys) {
    const met = (countsByWeek.get(key) ?? 0) >= target;
    const weekDate = parseDateKey(key);

    if (prevWeek) {
      const expectedPrev = new Date(weekDate);
      expectedPrev.setDate(expectedPrev.getDate() - 7);
      if (toDateKey(expectedPrev) !== toDateKey(prevWeek)) running = 0;
    }

    if (met) {
      running++;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
    prevWeek = weekDate;
  }

  return { current, longest };
}

/** % de cumplimiento en los últimos `days` días (respeta días "due" según frecuencia). */
export function calculateConsistency(
  habit: HabitLike,
  logs: LogLike[],
  days: number,
  today: Date = new Date()
): number {
  const completedDates = new Set(logs.filter((l) => l.completed).map((l) => l.date));

  let due = 0;
  let done = 0;
  const cursor = new Date(today);
  for (let i = 0; i < days; i++) {
    if (isDueOnDate(habit, cursor)) {
      due++;
      if (completedDates.has(toDateKey(cursor))) done++;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return due === 0 ? 0 : Math.round((done / due) * 100);
}
