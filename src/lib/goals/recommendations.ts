import { generateInterleavedSuggestions, type SubjectForSuggestions, type SuggestionTopic } from "@/lib/subjects/interleaving";
import { isDueForReview } from "@/lib/notes/spaced-repetition";
import { toDateKey } from "@/lib/habits/frequency";
import type { Goal, GoalSubtopic, GoalTask, GoalReview } from "@/lib/types";

export interface GoalRecommendation {
  goalId: string;
  goalTitle: string;
  goalColor: string;
  kind: "review" | "task" | "subtopic";
  label: string;
}

export interface StaleGoalAlert {
  goalId: string;
  goalTitle: string;
  daysSinceActivity: number;
}

/**
 * Para cada objetivo activo, elige su "próxima mejor acción" con esta
 * prioridad: repaso vencido > tarea sugerida para hoy > siguiente subtema
 * no iniciado. Después intercala entre objetivos (mismo algoritmo que
 * Materias) para no sugerir siempre el mismo objetivo seguido.
 */
export function generateStudyRecommendations(
  goals: Goal[],
  subtopicsByGoal: Map<string, GoalSubtopic[]>,
  tasksByGoal: Map<string, GoalTask[]>,
  reviewsBySubtopic: Map<string, GoalReview>,
  count: number,
  today: Date = new Date()
): GoalRecommendation[] {
  const activeGoals = goals.filter((g) => g.status === "active");
  const todayKey = toDateKey(today);

  const subjectsShaped: SubjectForSuggestions[] = activeGoals.map((g) => ({ id: g.id, name: g.title, color: g.color }));
  const topicsByGoal = new Map<string, SuggestionTopic[]>();
  const kindById = new Map<string, GoalRecommendation["kind"]>();

  for (const goal of activeGoals) {
    const subtopics = subtopicsByGoal.get(goal.id) ?? [];
    const tasks = tasksByGoal.get(goal.id) ?? [];

    // 1) ¿Hay algún repaso de subtema vencido? Tiene la prioridad más alta.
    const dueReview = subtopics.find((s) => {
      const review = reviewsBySubtopic.get(s.id);
      return review && isDueForReview(review.next_review_at, today);
    });
    if (dueReview) {
      kindById.set(dueReview.id, "review");
      topicsByGoal.set(goal.id, [{ id: dueReview.id, title: `Repasar: ${dueReview.title}`, weekNumber: 0, dueDate: null }]);
      continue;
    }

    // 2) ¿Hay alguna tarea sugerida para hoy (o sin fecha) todavía pendiente?
    const pendingTask = tasks
      .filter((t) => !t.completed && (!t.suggested_date || t.suggested_date <= todayKey))
      .sort((a, b) => (a.priority > b.priority ? -1 : 1))[0];
    if (pendingTask) {
      kindById.set(pendingTask.id, "task");
      topicsByGoal.set(goal.id, [{ id: pendingTask.id, title: pendingTask.title, weekNumber: 0, dueDate: pendingTask.due_date }]);
      continue;
    }

    // 3) Si no hay nada más pendiente, sugerir el siguiente subtema no iniciado.
    const nextSubtopic = [...subtopics]
      .filter((s) => s.status === "no_iniciado")
      .sort((a, b) => a.sort_order - b.sort_order)[0];
    if (nextSubtopic) {
      kindById.set(nextSubtopic.id, "subtopic");
      topicsByGoal.set(goal.id, [{ id: nextSubtopic.id, title: `Empezar: ${nextSubtopic.title}`, weekNumber: nextSubtopic.sort_order, dueDate: null }]);
    } else {
      topicsByGoal.set(goal.id, []);
    }
  }

  const suggestions = generateInterleavedSuggestions(subjectsShaped, topicsByGoal, count);

  return suggestions.map((s) => ({
    goalId: s.subjectId,
    goalTitle: s.subjectName,
    goalColor: s.subjectColor,
    kind: kindById.get(s.topicId) ?? "task",
    label: s.topicTitle,
  }));
}

/** Objetivos activos sin ninguna actividad (estudio de subtema) en `thresholdDays` o más. */
export function findStaleGoals(
  goals: Goal[],
  subtopicsByGoal: Map<string, GoalSubtopic[]>,
  thresholdDays = 5,
  today: Date = new Date()
): StaleGoalAlert[] {
  const alerts: StaleGoalAlert[] = [];

  for (const goal of goals) {
    if (goal.status !== "active") continue;
    const subtopics = subtopicsByGoal.get(goal.id) ?? [];
    const lastStudied = subtopics
      .map((s) => s.last_studied_at)
      .filter((d): d is string => Boolean(d))
      .sort()
      .at(-1);

    const reference = lastStudied ? new Date(lastStudied) : new Date(goal.start_date + "T00:00:00");
    const days = Math.floor((today.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24));

    if (days >= thresholdDays) {
      alerts.push({ goalId: goal.id, goalTitle: goal.title, daysSinceActivity: days });
    }
  }

  return alerts;
}
