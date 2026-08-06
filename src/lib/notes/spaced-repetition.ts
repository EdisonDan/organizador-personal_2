import { toDateKey } from "@/lib/habits/frequency";

/** Intervalos crecientes en días: al día siguiente, luego 3, 7, 14, 30 (se mantiene en 30 después). */
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30];

export interface ReviewSchedule {
  interval_stage: number;
  next_review_at: string; // YYYY-MM-DD
}

/**
 * Calcula la siguiente fecha de repaso.
 * - success = true: avanza de etapa (intervalo más largo).
 * - success = false: vuelve a la etapa 0 (repasar mañana) -- no hay
 *   castigo, solo se reconoce que hace falta repasarlo pronto de nuevo.
 */
export function scheduleNextReview(
  currentStage: number,
  success: boolean,
  today: Date = new Date()
): ReviewSchedule {
  const nextStage = success ? currentStage + 1 : 0;
  const days = REVIEW_INTERVALS_DAYS[Math.min(nextStage, REVIEW_INTERVALS_DAYS.length - 1)];

  const next = new Date(today);
  next.setDate(next.getDate() + days);

  return { interval_stage: nextStage, next_review_at: toDateKey(next) };
}

export function isDueForReview(nextReviewAt: string, today: Date = new Date()): boolean {
  return nextReviewAt <= toDateKey(today);
}
