import type { GlobalStats } from "@/lib/gamification/get-global-stats";

export type AchievementType =
  | "first_habit"
  | "week_streak"
  | "month_streak"
  | "pomodoro_starter"
  | "pomodoro_master"
  | "review_master"
  | "subject_complete"
  | "level_5";

export interface AchievementDef {
  type: AchievementType;
  title: string;
  description: string;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { type: "first_habit", title: "Primeros pasos", description: "Completa tu primer hábito" },
  { type: "week_streak", title: "Una semana seguida", description: "Alcanza una racha de 7 días" },
  { type: "month_streak", title: "Un mes de constancia", description: "Alcanza una racha de 30 días" },
  { type: "pomodoro_starter", title: "Enfocado", description: "Completa 10 sesiones de Pomodoro" },
  { type: "pomodoro_master", title: "Maestro del Pomodoro", description: "Completa 50 sesiones de Pomodoro" },
  { type: "review_master", title: "Repasador constante", description: "Repasa 20 notas" },
  { type: "subject_complete", title: "Materia completa", description: "Termina el 100% de los temas de una materia" },
  { type: "level_5", title: "Nivel 5", description: "Alcanza el nivel 5 de constancia" },
];

/** Evalúa qué logros están desbloqueados en este momento, según la actividad real. */
export function evaluateAchievements(
  stats: GlobalStats,
  anySubjectComplete: boolean
): Record<AchievementType, boolean> {
  return {
    first_habit: stats.counts.habitsCompleted >= 1,
    week_streak: stats.longestStreak >= 7,
    month_streak: stats.longestStreak >= 30,
    pomodoro_starter: stats.counts.pomodorosCompleted >= 10,
    pomodoro_master: stats.counts.pomodorosCompleted >= 50,
    review_master: stats.counts.notesReviewed >= 20,
    subject_complete: anySubjectComplete,
    level_5: stats.level >= 5,
  };
}
