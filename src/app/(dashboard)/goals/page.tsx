import { createClient } from "@/lib/supabase/server";
import { GoalsClient } from "@/components/goals/goals-client";
import type { Goal, GoalSubtopic, GoalTask, GoalReview, Habit, Subject, PomodoroSession } from "@/lib/types";

export const metadata = { title: "Objetivos · Panel Personal" };

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: goals },
    { data: subtopics },
    { data: tasks },
    { data: reviews },
    { data: pomodoros },
    { data: habits },
    { data: subjects },
  ] = await Promise.all([
    supabase.from("goals").select("*").eq("user_id", user!.id).order("created_at").returns<Goal[]>(),
    supabase.from("goal_subtopics").select("*").eq("user_id", user!.id).returns<GoalSubtopic[]>(),
    supabase.from("goal_tasks").select("*").eq("user_id", user!.id).returns<GoalTask[]>(),
    supabase.from("goal_reviews").select("*").eq("user_id", user!.id).returns<GoalReview[]>(),
    supabase.from("pomodoro_sessions").select("*").eq("user_id", user!.id).eq("completed", true).not("goal_id", "is", null).returns<PomodoroSession[]>(),
    supabase.from("habits").select("*").eq("user_id", user!.id).eq("archived", false).returns<Habit[]>(),
    supabase.from("subjects").select("*").eq("user_id", user!.id).eq("archived", false).returns<Subject[]>(),
  ]);

  const subtopicsByGoal = new Map<string, GoalSubtopic[]>();
  for (const s of subtopics ?? []) {
    if (!subtopicsByGoal.has(s.goal_id)) subtopicsByGoal.set(s.goal_id, []);
    subtopicsByGoal.get(s.goal_id)!.push(s);
  }

  const tasksByGoal = new Map<string, GoalTask[]>();
  for (const t of tasks ?? []) {
    if (!tasksByGoal.has(t.goal_id)) tasksByGoal.set(t.goal_id, []);
    tasksByGoal.get(t.goal_id)!.push(t);
  }

  const reviewsBySubtopic = new Map((reviews ?? []).map((r) => [r.subtopic_id, r]));

  const pomodoroByGoal = new Map<string, PomodoroSession[]>();
  for (const p of pomodoros ?? []) {
    if (!p.goal_id) continue;
    if (!pomodoroByGoal.has(p.goal_id)) pomodoroByGoal.set(p.goal_id, []);
    pomodoroByGoal.get(p.goal_id)!.push(p);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Objetivos</h1>
        <p className="text-sm text-muted-foreground">Aprendizaje conectado con hábitos, horario y notas.</p>
      </div>

      <GoalsClient
        goals={goals ?? []}
        subtopicsByGoal={subtopicsByGoal}
        tasksByGoal={tasksByGoal}
        reviewsBySubtopic={reviewsBySubtopic}
        pomodoroByGoal={pomodoroByGoal}
        habits={habits ?? []}
        subjects={subjects ?? []}
      />
    </div>
  );
}
