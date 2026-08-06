import { createClient } from "@/lib/supabase/server";
import { getGlobalStats } from "@/lib/gamification/get-global-stats";
import { ACHIEVEMENT_DEFS, evaluateAchievements, type AchievementType } from "@/lib/gamification/achievements";
import type { Subject, SubjectTopic, SubjectWeek } from "@/lib/types";

export interface AchievementView {
  type: AchievementType;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function anySubjectAt100(supabase: SupabaseServerClient, userId: string): Promise<boolean> {
  const [{ data: subjects }, { data: weeks }, { data: topics }] = await Promise.all([
    supabase.from("subjects").select("id").eq("user_id", userId).returns<Pick<Subject, "id">[]>(),
    supabase.from("subject_weeks").select("id, subject_id").eq("user_id", userId).returns<Pick<SubjectWeek, "id" | "subject_id">[]>(),
    supabase.from("subject_topics").select("week_id, completed").eq("user_id", userId).returns<Pick<SubjectTopic, "week_id" | "completed">[]>(),
  ]);
  if (!subjects || subjects.length === 0) return false;

  const weekToSubject = new Map((weeks ?? []).map((w) => [w.id, w.subject_id]));
  const bySubject = new Map<string, { done: number; total: number }>();
  for (const topic of topics ?? []) {
    const subjectId = weekToSubject.get(topic.week_id);
    if (!subjectId) continue;
    const entry = bySubject.get(subjectId) ?? { done: 0, total: 0 };
    entry.total++;
    if (topic.completed) entry.done++;
    bySubject.set(subjectId, entry);
  }

  return Array.from(bySubject.values()).some((s) => s.total > 0 && s.done === s.total);
}

/** Revisa los logros, guarda los nuevos que se hayan desbloqueado, y devuelve la galería completa. */
export async function syncAndGetAchievements(userId: string): Promise<AchievementView[]> {
  const supabase = await createClient();

  const [stats, subjectComplete, { data: existing }] = await Promise.all([
    getGlobalStats(supabase, userId),
    anySubjectAt100(supabase, userId),
    supabase.from("achievements").select("achievement_type, unlocked_at").eq("user_id", userId),
  ]);

  const unlockedNow = evaluateAchievements(stats, subjectComplete);
  const existingTypes = new Map((existing ?? []).map((a) => [a.achievement_type, a.unlocked_at]));

  const toInsert = ACHIEVEMENT_DEFS.filter((def) => unlockedNow[def.type] && !existingTypes.has(def.type)).map(
    (def) => ({ user_id: userId, achievement_type: def.type })
  );

  if (toInsert.length > 0) {
    const { error } = await supabase.from("achievements").insert(toInsert);
    // Si otra pestaña ya lo insertó justo antes, el unique(user_id, achievement_type)
    // puede rechazar el duplicado -- no es un error real, se ignora.
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      console.error("No se pudieron guardar los logros nuevos:", error.message);
    }
  }

  const now = new Date().toISOString();
  return ACHIEVEMENT_DEFS.map((def) => ({
    type: def.type,
    title: def.title,
    description: def.description,
    unlocked: unlockedNow[def.type],
    unlockedAt: existingTypes.get(def.type) ?? (unlockedNow[def.type] ? now : null),
  }));
}
