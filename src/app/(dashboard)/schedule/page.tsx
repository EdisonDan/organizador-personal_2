import { createClient } from "@/lib/supabase/server";
import { ScheduleClient } from "@/components/schedule/schedule-client";
import type { ScheduleBlock, Subject, Habit, Deadline, PomodoroSession, Profile, Goal } from "@/lib/types";

export const metadata = { title: "Horario · Panel Personal" };

export default async function SchedulePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    { data: blocks },
    { data: subjects },
    { data: habits },
    { data: deadlines },
    { data: pomodoroToday },
    { data: profile },
    { data: goals },
  ] = await Promise.all([
    supabase.from("schedule_blocks").select("*").eq("user_id", user!.id).returns<ScheduleBlock[]>(),
    supabase
      .from("subjects")
      .select("*")
      .eq("user_id", user!.id)
      .eq("archived", false)
      .order("sort_order")
      .returns<Subject[]>(),
    supabase
      .from("habits")
      .select("*")
      .eq("user_id", user!.id)
      .eq("archived", false)
      .returns<Habit[]>(),
    supabase
      .from("deadlines")
      .select("*")
      .eq("user_id", user!.id)
      .order("due_date")
      .returns<Deadline[]>(),
    supabase
      .from("pomodoro_sessions")
      .select("*")
      .eq("user_id", user!.id)
      .eq("completed", true)
      .gte("started_at", todayStart.toISOString())
      .returns<PomodoroSession[]>(),
    supabase.from("profiles").select("week_start_day").eq("id", user!.id).maybeSingle<Pick<Profile, "week_start_day">>(),
    supabase.from("goals").select("*").eq("user_id", user!.id).eq("status", "active").returns<Goal[]>(),
  ]);

  const subjectsList = subjects ?? [];
  const todayPomodoroCount = pomodoroToday?.length ?? 0;

  const bySubjectMap = new Map<string, number>();
  for (const session of pomodoroToday ?? []) {
    const key = session.subject_id ?? "none";
    bySubjectMap.set(key, (bySubjectMap.get(key) ?? 0) + 1);
  }
  const pomodoroBySubject = Array.from(bySubjectMap.entries()).map(([key, count]) => ({
    subjectId: key === "none" ? null : key,
    subjectName: key === "none" ? "Sin materia" : subjectsList.find((s) => s.id === key)?.name ?? "Materia",
    count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Horario</h1>
        <p className="text-sm text-muted-foreground">
          Time blocking, bloques recurrentes y Pomodoro por materia.
        </p>
      </div>

      <ScheduleClient
        blocks={blocks ?? []}
        subjects={subjectsList}
        habits={habits ?? []}
        goals={goals ?? []}
        deadlines={deadlines ?? []}
        todayPomodoroCount={todayPomodoroCount}
        pomodoroBySubject={pomodoroBySubject}
        weekStartsOn={profile?.week_start_day ?? 1}
      />
    </div>
  );
}
