"use client";

import { useMemo, useState } from "react";
import { Plus, Shuffle, AlertTriangle, BookOpen, RotateCcw, ListChecks } from "lucide-react";
import { GoalCard } from "@/components/goals/goal-card";
import { GoalFormDialog } from "@/components/goals/goal-form-dialog";
import { calculateGoalProgress } from "@/lib/goals/progress";
import { generateStudyRecommendations, findStaleGoals } from "@/lib/goals/recommendations";
import type { Goal, GoalSubtopic, GoalTask, GoalReview, Habit, Subject, PomodoroSession } from "@/lib/types";

const KIND_ICON = { review: RotateCcw, task: ListChecks, subtopic: BookOpen } as const;

export function GoalsClient({
  goals,
  subtopicsByGoal,
  tasksByGoal,
  reviewsBySubtopic,
  pomodoroByGoal,
  habits,
  subjects,
}: {
  goals: Goal[];
  subtopicsByGoal: Map<string, GoalSubtopic[]>;
  tasksByGoal: Map<string, GoalTask[]>;
  reviewsBySubtopic: Map<string, GoalReview>;
  pomodoroByGoal: Map<string, PomodoroSession[]>;
  habits: Habit[];
  subjects: Subject[];
}) {
  const [showForm, setShowForm] = useState(false);

  const activeGoals = useMemo(() => goals.filter((g) => g.status === "active"), [goals]);

  const recommendations = useMemo(
    () => generateStudyRecommendations(goals, subtopicsByGoal, tasksByGoal, reviewsBySubtopic, 4),
    [goals, subtopicsByGoal, tasksByGoal, reviewsBySubtopic]
  );

  const staleAlerts = useMemo(() => findStaleGoals(goals, subtopicsByGoal), [goals, subtopicsByGoal]);

  if (goals.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Plus className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Todavía no tienes objetivos</p>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              Aprender Python, aprender inglés, o cualquier meta de aprendizaje que quieras seguir de cerca.
            </p>
          </div>
          <button type="button" onClick={() => setShowForm(true)} className="btn-primary mt-1">
            <Plus className="h-4 w-4" />
            Crear objetivo
          </button>
        </div>
        <GoalFormDialog open={showForm} onClose={() => setShowForm(false)} habits={habits} subjects={subjects} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {staleAlerts.length > 0 && (
        <div className="space-y-2">
          {staleAlerts.map((alert) => (
            <div
              key={alert.goalId}
              className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold-soft px-4 py-2.5 text-sm"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-gold" />
              <span className="text-foreground">
                Llevas <span className="tabular-stat font-medium">{alert.daysSinceActivity}</span> días sin avanzar en{" "}
                <span className="font-medium">{alert.goalTitle}</span>.
              </span>
            </div>
          ))}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Shuffle className="h-3.5 w-3.5 text-primary" />
            Qué estudiar hoy
          </h2>
          <ul className="space-y-1.5">
            {recommendations.map((r, i) => {
              const Icon = KIND_ICON[r.kind];
              return (
                <li key={`${r.goalId}-${i}`} className="flex items-center gap-2.5 text-sm">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: r.goalColor }} />
                  <span className="text-muted-foreground">{r.goalTitle}:</span>
                  <span className="truncate text-foreground">{r.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Tus objetivos <span className="tabular-stat text-muted-foreground">({activeGoals.length} activos)</span>
        </h2>
        <button type="button" onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Nuevo objetivo
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {goals.map((goal) => {
          const progressPct = calculateGoalProgress(subtopicsByGoal.get(goal.id) ?? [], tasksByGoal.get(goal.id) ?? []);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const minutesThisWeek = (pomodoroByGoal.get(goal.id) ?? [])
            .filter((s) => new Date(s.started_at) >= weekAgo)
            .reduce((sum, s) => sum + s.duration_minutes, 0);

          return (
            <GoalCard
              key={goal.id}
              id={goal.id}
              title={goal.title}
              category={goal.category}
              color={goal.color}
              icon={goal.icon}
              progressPct={progressPct}
              minutesThisWeek={minutesThisWeek}
            />
          );
        })}
      </div>

      <GoalFormDialog open={showForm} onClose={() => setShowForm(false)} habits={habits} subjects={subjects} />
    </div>
  );
}
