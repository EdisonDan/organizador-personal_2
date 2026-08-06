import { startOfWeek } from "@/lib/habits/streaks";
import { toDateKey } from "@/lib/habits/frequency";

export { toDateKey };

// La grilla cubre de 6:00 a 23:00 en pasos de 30 minutos.
export const GRID_START_MIN = 6 * 60;
export const GRID_END_MIN = 23 * 60;
export const SLOT_MIN = 30;
export const SLOTS_PER_DAY = (GRID_END_MIN - GRID_START_MIN) / SLOT_MIN;

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60)
    .toString()
    .padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}:00`;
}

export function formatTimeLabel(min: number): string {
  const h = Math.floor(min / 60)
    .toString()
    .padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Índice de slot de 30 min (0-based) a partir de una hora "HH:MM:SS", relativo al inicio de la grilla. */
export function slotIndexFromTime(time: string): number {
  return Math.round((timeToMinutes(time) - GRID_START_MIN) / SLOT_MIN);
}

export function timeFromSlotIndex(slot: number): string {
  return minutesToTime(GRID_START_MIN + slot * SLOT_MIN);
}

export interface WeekDay {
  date: Date;
  dateKey: string;
  dayOfWeek: number; // 0=domingo..6=sábado
  label: string;
}

const DIA_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** Devuelve los 7 días de la semana que contiene `reference`, empezando en `weekStartsOn` (0=domingo..6=sábado, por defecto lunes). */
export function getWeekDays(reference: Date, weekStartsOn?: number): WeekDay[] {
  const start = startOfWeek(reference, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    return {
      date,
      dateKey: toDateKey(date),
      dayOfWeek: date.getDay(),
      label: DIA_LABELS[date.getDay()],
    };
  });
}

/** Cuenta regresiva legible: "Hoy", "Mañana", "Faltan 3 días", "Venció hace 2 días". */
export function formatCountdown(dueDate: Date, today: Date = new Date()): string {
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const b = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const diffDays = Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `Venció hace ${Math.abs(diffDays)} día${Math.abs(diffDays) === 1 ? "" : "s"}`;
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Mañana";
  return `Faltan ${diffDays} días`;
}

export function isOverdue(dueDate: Date, today: Date = new Date()): boolean {
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const b = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  return b.getTime() < a.getTime();
}
