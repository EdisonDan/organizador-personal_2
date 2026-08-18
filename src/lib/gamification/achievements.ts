import type { GlobalStats } from "@/lib/gamification/get-global-stats";

export type AchievementType =
  | "first_habit"
  | "week_streak"
  | "month_streak"
  | "pomodoro_starter"
  | "pomodoro_master"
  | "review_master"
  | "subject_complete"
  | "level_5"
  | "first_promise_completed"
  | "five_promises_completed"
  | "ten_promises_completed"
  | "yearly_promise_completed"
  | "creative_promise_completed";

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
  { type: "first_promise_completed", title: "Primera promesa", description: "Cumple tu primera promesa" },
  { type: "five_promises_completed", title: "Cinco promesas", description: "Cumple 5 promesas" },
  { type: "ten_promises_completed", title: "Diez promesas", description: "Cumple 10 promesas" },
  { type: "yearly_promise_completed", title: "Promesa del año", description: "Cumple una promesa del año" },
  { type: "creative_promise_completed", title: "Espíritu creativo", description: "Cumple una promesa creativa" },
];

export interface AchievementContext {
  anySubjectComplete: boolean;
  promisesCompletedCount: number;
  anyYearlyPromiseCompleted: boolean;
  anyCreativePromiseCompleted: boolean;
}

/** Evalúa qué logros están desbloqueados en este momento, según la actividad real. */
export function evaluateAchievements(stats: GlobalStats, context: AchievementContext): Record<AchievementType, boolean> {
  return {
    first_habit: stats.counts.habitsCompleted >= 1,
    week_streak: stats.longestStreak >= 7,
    month_streak: stats.longestStreak >= 30,
    pomodoro_starter: stats.counts.pomodorosCompleted >= 10,
    pomodoro_master: stats.counts.pomodorosCompleted >= 50,
    review_master: stats.counts.notesReviewed >= 20,
    subject_complete: context.anySubjectComplete,
    level_5: stats.level >= 5,
    first_promise_completed: context.promisesCompletedCount >= 1,
    five_promises_completed: context.promisesCompletedCount >= 5,
    ten_promises_completed: context.promisesCompletedCount >= 10,
    yearly_promise_completed: context.anyYearlyPromiseCompleted,
    creative_promise_completed: context.anyCreativePromiseCompleted,
  };
}
