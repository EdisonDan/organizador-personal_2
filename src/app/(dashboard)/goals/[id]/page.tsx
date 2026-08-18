import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GoalDetailClient } from "@/components/goals/goal-detail-client";
import type {
  Goal,
  GoalSubtopic,
  GoalTask,
  GoalReview,
  GoalResource,
  GoalHabitLink,
  GoalNoteLink,
  Habit,
  HabitLog,
  Subject,
  Note,
  ScheduleBlock,
  PomodoroSession,
} from "@/lib/types";

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: goal },
    { data: subtopics },
    { data: tasks },
    { data: reviews },
    { data: resources },
    { data: habitLinks },
    { data: noteLinks },
    { data: allHabits },
    { data: allSubjects },
    { data: allNotes },
    { data: scheduleBlocks },
    { data: pomodoroSessions },
  ] = await Promise.all([
    supabase.from("goals").select("*").eq("id", id).eq("user_id", user!.id).maybeSingle<Goal>(),
    supabase.from("goal_subtopics").select("*").eq("goal_id", id).eq("user_id", user!.id).order("sort_order").returns<GoalSubtopic[]>(),
    supabase.from("goal_tasks").select("*").eq("goal_id", id).eq("user_id", user!.id).order("sort_order").returns<GoalTask[]>(),
    supabase.from("goal_reviews").select("*").eq("user_id", user!.id).returns<GoalReview[]>(),
    supabase.from("goal_resources").select("*").eq("goal_id", id).eq("user_id", user!.id).returns<GoalResource[]>(),
    supabase.from("goal_habit_links").select("*").eq("goal_id", id).eq("user_id", user!.id).returns<GoalHabitLink[]>(),
    supabase.from("goal_note_links").select("*").eq("goal_id", id).eq("user_id", user!.id).returns<GoalNoteLink[]>(),
    supabase.from("habits").select("*").eq("user_id", user!.id).eq("archived", false).returns<Habit[]>(),
    supabase.from("subjects").select("*").eq("user_id", user!.id).eq("archived", false).returns<Subject[]>(),
    supabase.from("notes").select("*").eq("user_id", user!.id).returns<Note[]>(),
    supabase.from("schedule_blocks").select("*").eq("goal_id", id).eq("user_id", user!.id).returns<ScheduleBlock[]>(),
    supabase.from("pomodoro_sessions").select("*").eq("goal_id", id).eq("user_id", user!.id).eq("completed", true).returns<PomodoroSession[]>(),
  ]);

  if (!goal) notFound();

  // Repasos: solo los de los subtemas de ESTE objetivo (goal_reviews no tiene goal_id directo)
  const subtopicIds = new Set((subtopics ?? []).map((s) => s.id));
  const goalReviews = (reviews ?? []).filter((r) => subtopicIds.has(r.subtopic_id));

  const linkedNotesById = new Map((allNotes ?? []).map((n) => [n.id, n]));

  const linkedHabitIds = (habitLinks ?? []).map((l) => l.habit_id);
  const { data: habitLogs } =
    linkedHabitIds.length > 0
      ? await supabase.from("habit_logs").select("*").eq("user_id", user!.id).in("habit_id", linkedHabitIds).returns<HabitLog[]>()
      : { data: [] as HabitLog[] };

  const habitLogsByHabit = new Map<string, HabitLog[]>();
  for (const log of habitLogs ?? []) {
    if (!habitLogsByHabit.has(log.habit_id)) habitLogsByHabit.set(log.habit_id, []);
    habitLogsByHabit.get(log.habit_id)!.push(log);
  }

  return (
    <div className="space-y-4">
      <Link href="/goals" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Objetivos
      </Link>
      <GoalDetailClient
        goal={goal}
        subtopics={subtopics ?? []}
        tasks={tasks ?? []}
        reviews={goalReviews}
        resources={resources ?? []}
        habitLinks={habitLinks ?? []}
        noteLinks={noteLinks ?? []}
        linkedNotesById={linkedNotesById}
        allHabits={allHabits ?? []}
        allSubjects={allSubjects ?? []}
        allNotes={allNotes ?? []}
        scheduleBlocks={scheduleBlocks ?? []}
        pomodoroSessions={pomodoroSessions ?? []}
        habitLogsByHabit={habitLogsByHabit}
      />
    </div>
  );
}
