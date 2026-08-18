import { calculateGlobalStreak } from "@/lib/gamification/stats";
import { toDateKey } from "@/lib/habits/frequency";
import type { GoalSubtopic, GoalTask, GoalReview, PomodoroSession } from "@/lib/types";

export interface GoalStats {
  minutesThisWeek: number;
  minutesTotal: number;
  tasksCompleted: number;
  tasksTotal: number;
  subtopicsConsolidated: number;
  subtopicsTotal: number;
  studyStreak: { current: number; longest: number };
  daysSinceActivity: number | null;
  reviewsDone: number;
  reviewsPending: number;
}

export function calculateGoalStats(
  subtopics: GoalSubtopic[],
  tasks: GoalTask[],
  reviews: GoalReview[],
  pomodoroSessions: PomodoroSession[],
  today: Date = new Date()
): GoalStats {
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const minutesTotal = pomodoroSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const minutesThisWeek = pomodoroSessions
    .filter((s) => new Date(s.started_at) >= weekAgo)
    .reduce((sum, s) => sum + s.duration_minutes, 0);

  // Racha de estudio: cualquier día con una sesión pomodoro o un subtema
  // marcado como estudiado cuenta como "día activo" para este objetivo.
  const activeDates = new Set<string>();
  pomodoroSessions.forEach((s) => activeDates.add(s.started_at.slice(0, 10)));
  subtopics.forEach((s) => {
    if (s.last_studied_at) activeDates.add(s.last_studied_at.slice(0, 10));
  });
  const studyStreak = calculateGlobalStreak(activeDates, today);

  const lastActivity = Array.from(activeDates).sort().at(-1);
  const daysSinceActivity = lastActivity
    ? Math.floor((today.getTime() - new Date(lastActivity + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const todayKey = toDateKey(today);
  const reviewsPending = reviews.filter((r) => r.next_review_at <= todayKey).length;
  const reviewsDone = reviews.filter((r) => r.last_reviewed_at).length;

  return {
    minutesThisWeek,
    minutesTotal,
    tasksCompleted: tasks.filter((t) => t.completed).length,
    tasksTotal: tasks.length,
    subtopicsConsolidated: subtopics.filter((s) => s.status === "consolidado").length,
    subtopicsTotal: subtopics.length,
    studyStreak,
    daysSinceActivity,
    reviewsDone,
    reviewsPending,
  };
}
