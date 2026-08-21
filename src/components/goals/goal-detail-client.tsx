"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Archive, Trash2, CheckCircle2 } from "lucide-react";
import { HabitIcon } from "@/components/habits/icon-picker";
import { GoalFormDialog } from "@/components/goals/goal-form-dialog";
import { GoalSummaryTab } from "@/components/goals/tabs/goal-summary-tab";
import { GoalSubtopicsTab } from "@/components/goals/tabs/goal-subtopics-tab";
import { GoalTasksTab } from "@/components/goals/tabs/goal-tasks-tab";
import { GoalHabitsTab } from "@/components/goals/tabs/goal-habits-tab";
import { GoalSessionsTab } from "@/components/goals/tabs/goal-sessions-tab";
import { GoalNotesTab } from "@/components/goals/tabs/goal-notes-tab";
import { GoalReviewsTab } from "@/components/goals/tabs/goal-reviews-tab";
import { GoalResourcesTab } from "@/components/goals/tabs/goal-resources-tab";
import { GoalStatsTab } from "@/components/goals/tabs/goal-stats-tab";
import { calculateGoalProgress } from "@/lib/goals/progress";
import { setGoalStatus, deleteGoal } from "@/app/(dashboard)/goals/actions";
import { cn } from "@/lib/utils";
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

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "subtemas", label: "Subtemas" },
  { id: "tareas", label: "Tareas" },
  { id: "habitos", label: "Hábitos" },
  { id: "sesiones", label: "Sesiones" },
  { id: "notas", label: "Notas" },
  { id: "repasos", label: "Repasos" },
  { id: "recursos", label: "Recursos" },
  { id: "estadisticas", label: "Estadísticas" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function GoalDetailClient({
  goal,
  subtopics,
  tasks,
  reviews,
  resources,
  habitLinks,
  noteLinks,
  linkedNotesById,
  allHabits,
  allSubjects,
  allNotes,
  scheduleBlocks,
  pomodoroSessions,
  habitLogsByHabit,
}: {
  goal: Goal;
  subtopics: GoalSubtopic[];
  tasks: GoalTask[];
  reviews: GoalReview[];
  resources: GoalResource[];
  habitLinks: GoalHabitLink[];
  noteLinks: GoalNoteLink[];
  linkedNotesById: Map<string, Note>;
  allHabits: Habit[];
  allSubjects: Subject[];
  allNotes: Note[];
  scheduleBlocks: ScheduleBlock[];
  pomodoroSessions: PomodoroSession[];
  habitLogsByHabit: Map<string, HabitLog[]>;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("resumen");
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const progressPct = calculateGoalProgress(subtopics, tasks);

  async function handleArchive() {
    setBusy(true);
    await setGoalStatus(goal.id, goal.status === "archived" ? "active" : "archived");
    setBusy(false);
  }

  async function handleComplete() {
    setBusy(true);
    await setGoalStatus(goal.id, "completed");
    setBusy(false);
  }

  async function handleDelete() {
    if (!confirm(`¿Borrar "${goal.title}" y todo su contenido? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    await deleteGoal(goal.id);
    router.push("/goals");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${goal.color}22` }}
          >
            <HabitIcon name={goal.icon} className="h-6 w-6" style={{ color: goal.color }} />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{goal.title}</h1>
            <p className="text-sm text-muted-foreground">
              {goal.category || "Objetivo"}
              {goal.status !== "active" && ` · ${statusLabel(goal.status)}`}
            </p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {goal.status === "active" && (
            <button
              type="button"
              onClick={handleComplete}
              disabled={busy}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-primary hover:bg-primary-soft disabled:opacity-60"
              aria-label="Marcar como completado"
              title="Marcar como completado"
            >
              <CheckCircle2 className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
            aria-label="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleArchive}
            disabled={busy}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-60"
            aria-label="Archivar"
          >
            <Archive className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-destructive hover:bg-destructive/10 disabled:opacity-60"
            aria-label="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: goal.color }} />
      </div>

      <div className="scrollbar-none flex gap-1 overflow-x-auto rounded-full border border-border bg-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              tab === t.id ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "resumen" && (
        <GoalSummaryTab goal={goal} subtopics={subtopics} tasks={tasks} reviews={reviews} pomodoroSessions={pomodoroSessions} />
      )}
      {tab === "subtemas" && <GoalSubtopicsTab goal={goal} subtopics={subtopics} />}
      {tab === "tareas" && <GoalTasksTab goal={goal} tasks={tasks} subtopics={subtopics} />}
      {tab === "habitos" && <GoalHabitsTab goal={goal} habitLinks={habitLinks} allHabits={allHabits} habitLogsByHabit={habitLogsByHabit} />}
      {tab === "sesiones" && (
        <GoalSessionsTab goal={goal} subjects={allSubjects} scheduleBlocks={scheduleBlocks} pomodoroSessions={pomodoroSessions} />
      )}
      {tab === "notas" && (
        <GoalNotesTab goal={goal} noteLinks={noteLinks} linkedNotesById={linkedNotesById} allNotes={allNotes} subtopics={subtopics} />
      )}
      {tab === "repasos" && <GoalReviewsTab goal={goal} subtopics={subtopics} reviews={reviews} />}
      {tab === "recursos" && <GoalResourcesTab goal={goal} resources={resources} subtopics={subtopics} userId={goal.user_id} />}
      {tab === "estadisticas" && (
        <GoalStatsTab subtopics={subtopics} tasks={tasks} reviews={reviews} pomodoroSessions={pomodoroSessions} />
      )}

      <GoalFormDialog open={editOpen} onClose={() => setEditOpen(false)} habits={allHabits} subjects={allSubjects} goal={goal} />
    </div>
  );
}

function statusLabel(status: Goal["status"]) {
  return { active: "Activo", paused: "Pausado", completed: "Completado", archived: "Archivado" }[status];
}
