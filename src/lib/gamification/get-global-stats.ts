import { createClient } from "@/lib/supabase/server";
import { calculateGlobalStreak, calculatePoints, calculateLevel } from "@/lib/gamification/stats";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface GlobalStats {
  currentStreak: number;
  longestStreak: number;
  points: number;
  level: number;
  pointsIntoLevel: number;
  pointsForNextLevel: number;
  counts: {
    habitsCompleted: number;
    pomodorosCompleted: number;
    topicsCompleted: number;
    notesReviewed: number;
    promisesCompleted: number;
  };
}

/**
 * Se recalcula a partir de la actividad real cada vez que se pide (no se
 * confía en columnas cacheadas en `profiles`), así el número que se ve en
 * el TopBar, en Perfil y en Logros siempre es el mismo y siempre es correcto.
 * A esta escala de datos (uso personal) el costo de recalcular es mínimo.
 */
export async function getGlobalStats(supabase: SupabaseServerClient, userId: string): Promise<GlobalStats> {
  const [{ data: habitLogs }, { data: pomodoros }, { data: reviews }, { data: topics }, { data: promises }] =
    await Promise.all([
      supabase.from("habit_logs").select("date").eq("user_id", userId).eq("completed", true),
      supabase.from("pomodoro_sessions").select("started_at").eq("user_id", userId).eq("completed", true),
      supabase.from("note_reviews").select("last_reviewed_at").eq("user_id", userId).not("last_reviewed_at", "is", null),
      supabase.from("subject_topics").select("id").eq("user_id", userId).eq("completed", true),
      supabase.from("promises").select("id").eq("user_id", userId).eq("status", "completed"),
    ]);

  const activeDates = new Set<string>();
  const habitDates: string[] = (habitLogs ?? []).map((r: { date: string }) => r.date);
  habitDates.forEach((d) => activeDates.add(d));
  (pomodoros ?? []).forEach((r: { started_at: string }) => activeDates.add(r.started_at.slice(0, 10)));
  (reviews ?? []).forEach((r: { last_reviewed_at: string }) => activeDates.add(r.last_reviewed_at.slice(0, 10)));

  const { current, longest } = calculateGlobalStreak(activeDates);

  const counts = {
    habitsCompleted: habitDates.length,
    pomodorosCompleted: (pomodoros ?? []).length,
    topicsCompleted: (topics ?? []).length,
    notesReviewed: (reviews ?? []).length,
    promisesCompleted: (promises ?? []).length,
  };
  const points = calculatePoints(counts);
  const { level, pointsIntoLevel, pointsForNextLevel } = calculateLevel(points);

  return { currentStreak: current, longestStreak: longest, points, level, pointsIntoLevel, pointsForNextLevel, counts };
}
