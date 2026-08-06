import type { Habit } from "@/lib/types";

/** Formatea una fecha como YYYY-MM-DD en horario local (evita líos de UTC). */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * ¿Este hábito "toca" hacerse en esta fecha?
 * - daily: todos los días.
 * - specific_days: solo los días de semana configurados (0=domingo..6=sábado).
 * - weekly_count: cualquier día puede contar para la meta semanal, así que
 *   se considera "due" todos los días (el cumplimiento se evalúa por semana).
 */
export function isDueOnDate(habit: Pick<Habit, "frequency_type" | "frequency_config">, date: Date): boolean {
  if (habit.frequency_type === "specific_days") {
    const days = (habit.frequency_config?.days as number[] | undefined) ?? [];
    if (days.length === 0) return true; // sin configurar todavía: no bloquear
    return days.includes(date.getDay());
  }
  return true;
}
