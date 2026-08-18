import type { GoalSubtopic, GoalTask } from "@/lib/types";

/**
 * Progreso de un objetivo: promedio entre el progreso de sus subtemas
 * (peso principal, porque reflejan dominio real) y el % de tareas
 * completadas (peso menor, porque las tareas son más mecánicas).
 * Si no hay subtemas todavía, se usa solo el % de tareas.
 */
export function calculateGoalProgress(subtopics: GoalSubtopic[], tasks: GoalTask[]): number {
  const subtopicPct =
    subtopics.length === 0
      ? null
      : Math.round(subtopics.reduce((sum, s) => sum + statusToProgress(s.status, s.progress_pct), 0) / subtopics.length);

  const taskPct = tasks.length === 0 ? null : Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100);

  if (subtopicPct === null && taskPct === null) return 0;
  if (subtopicPct === null) return taskPct!;
  if (taskPct === null) return subtopicPct;

  return Math.round(subtopicPct * 0.7 + taskPct * 0.3);
}

/** Si el subtema tiene un progreso manual (progress_pct > 0) se respeta; si no, se infiere del estado. */
function statusToProgress(status: GoalSubtopic["status"], manualPct: number): number {
  if (manualPct > 0) return manualPct;
  switch (status) {
    case "no_iniciado":
      return 0;
    case "entendiendo":
      return 33;
    case "practicando":
      return 66;
    case "consolidado":
      return 100;
  }
}

export function subtopicsSummary(subtopics: GoalSubtopic[]) {
  return {
    total: subtopics.length,
    consolidado: subtopics.filter((s) => s.status === "consolidado").length,
    practicando: subtopics.filter((s) => s.status === "practicando").length,
    entendiendo: subtopics.filter((s) => s.status === "entendiendo").length,
    no_iniciado: subtopics.filter((s) => s.status === "no_iniciado").length,
  };
}
