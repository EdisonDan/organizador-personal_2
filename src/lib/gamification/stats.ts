import { toDateKey } from "@/lib/habits/frequency";

export interface StreakResult {
  current: number;
  longest: number;
}

/**
 * Racha de constancia general: cuenta días consecutivos en los que hubo
 * cualquier actividad (hábito completado, pomodoro, o repaso de nota).
 * Igual que la racha de hábitos: si hoy todavía no hay actividad, no rompe
 * la racha de ayer (el día sigue en curso).
 */
export function calculateGlobalStreak(activeDates: Set<string>, today: Date = new Date()): StreakResult {
  const todayKey = toDateKey(today);

  let current = 0;
  const cursor = new Date(today);
  let isToday = true;
  for (;;) {
    const key = toDateKey(cursor);
    if (activeDates.has(key)) {
      current++;
    } else if (!(isToday && key === todayKey)) {
      break;
    }
    isToday = false;
    cursor.setDate(cursor.getDate() - 1);
    if (today.getTime() - cursor.getTime() > 1000 * 60 * 60 * 24 * 365 * 5) break;
  }

  const sortedDates = Array.from(activeDates).sort();
  let longest = current;
  if (sortedDates.length > 0) {
    let running = 0;
    const cursor2 = new Date(sortedDates[0] + "T00:00:00");
    while (cursor2 <= today) {
      const key = toDateKey(cursor2);
      if (activeDates.has(key)) {
        running++;
        longest = Math.max(longest, running);
      } else if (key !== todayKey) {
        running = 0;
      }
      cursor2.setDate(cursor2.getDate() + 1);
    }
  }

  return { current, longest };
}

export interface ActivityCounts {
  habitsCompleted: number;
  pomodorosCompleted: number;
  topicsCompleted: number;
  notesReviewed: number;
}

const POINTS_PER = {
  habit: 2,
  pomodoro: 3,
  topic: 4,
  reviewedNote: 1,
};

const POINTS_PER_LEVEL = 100;

export function calculatePoints(counts: ActivityCounts): number {
  return (
    counts.habitsCompleted * POINTS_PER.habit +
    counts.pomodorosCompleted * POINTS_PER.pomodoro +
    counts.topicsCompleted * POINTS_PER.topic +
    counts.notesReviewed * POINTS_PER.reviewedNote
  );
}

export function calculateLevel(points: number): { level: number; pointsIntoLevel: number; pointsForNextLevel: number } {
  const level = Math.floor(points / POINTS_PER_LEVEL) + 1;
  const pointsIntoLevel = points % POINTS_PER_LEVEL;
  return { level, pointsIntoLevel, pointsForNextLevel: POINTS_PER_LEVEL };
}
