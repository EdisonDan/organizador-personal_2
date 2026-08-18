"use client";

import { useState } from "react";
import { Plus, Trash2, BookOpen, PlayCircle, Dumbbell, FileText, Brain, RotateCcw, Users, ClipboardCheck, Rocket } from "lucide-react";
import { createTask, toggleTask, deleteTask } from "@/app/(dashboard)/goals/actions";
import { cn } from "@/lib/utils";
import type { Goal, GoalTask, GoalTaskType, GoalSubtopic } from "@/lib/types";

const TYPE_META: Record<GoalTaskType, { label: string; icon: typeof BookOpen }> = {
  leer: { label: "Leer", icon: BookOpen },
  ver_recurso: { label: "Ver recurso", icon: PlayCircle },
  ejercicios: { label: "Ejercicios", icon: Dumbbell },
  resumir: { label: "Resumir", icon: FileText },
  active_recall: { label: "Active recall", icon: Brain },
  repasar: { label: "Repasar", icon: RotateCcw },
  practica_guiada: { label: "Práctica guiada", icon: Users },
  mini_evaluacion: { label: "Mini evaluación", icon: ClipboardCheck },
  proyecto: { label: "Proyecto", icon: Rocket },
};

export function GoalTasksTab({ goal, tasks, subtopics }: { goal: Goal; tasks: GoalTask[]; subtopics: GoalSubtopic[] }) {
  const [showForm, setShowForm] = useState(false);
  const pending = tasks.filter((t) => !t.completed).sort((a, b) => a.sort_order - b.sort_order);
  const done = tasks.filter((t) => t.completed);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          Tareas <span className="tabular-stat text-muted-foreground">({done.length}/{tasks.length})</span>
        </p>
        <button type="button" onClick={() => setShowForm((v) => !v)} className="btn-secondary text-xs">
          <Plus className="h-3.5 w-3.5" />
          Nueva tarea
        </button>
      </div>

      {showForm && <TaskForm goal={goal} subtopics={subtopics} onDone={() => setShowForm(false)} nextSortOrder={tasks.length} />}

      {pending.length === 0 && done.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Sin tareas todavía. Ej. &quot;Resolver 5 ejercicios de bucles&quot; o &quot;Hacer active recall de Variables&quot;.
        </p>
      ) : (
        <div className="space-y-2">
          {pending.map((task) => (
            <TaskRow key={task.id} task={task} goal={goal} subtopics={subtopics} />
          ))}
          {done.length > 0 && (
            <>
              <p className="pt-2 text-xs font-medium text-muted-foreground">Completadas</p>
              {done.map((task) => (
                <TaskRow key={task.id} task={task} goal={goal} subtopics={subtopics} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, goal, subtopics }: { task: GoalTask; goal: Goal; subtopics: GoalSubtopic[] }) {
  const meta = TYPE_META[task.task_type];
  const Icon = meta.icon;
  const subtopic = subtopics.find((s) => s.id === task.subtopic_id);

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-border bg-card p-3">
      <button
        type="button"
        onClick={() => toggleTask(task.id, goal.id, !task.completed).catch(() => {})}
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
          task.completed ? "border-primary bg-primary" : "border-border"
        )}
      >
        {task.completed && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm text-foreground", task.completed && "text-muted-foreground line-through")}>{task.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
            <Icon className="h-2.5 w-2.5" />
            {meta.label}
          </span>
          {subtopic && <span className="rounded-full bg-muted px-2 py-0.5">{subtopic.title}</span>}
          {task.due_date && <span className="tabular-stat">Vence {task.due_date}</span>}
        </div>
      </div>
      <button
        type="button"
        onClick={() => deleteTask(task.id, goal.id).catch(() => {})}
        aria-label="Eliminar tarea"
        className="shrink-0 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function TaskForm({
  goal,
  subtopics,
  nextSortOrder,
  onDone,
}: {
  goal: Goal;
  subtopics: GoalSubtopic[];
  nextSortOrder: number;
  onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<GoalTaskType>("ejercicios");
  const [subtopicId, setSubtopicId] = useState("");
  const [suggestedDate, setSuggestedDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await createTask(goal.id, {
      title: title.trim(),
      description: null,
      task_type: type,
      subtopic_id: subtopicId || null,
      difficulty: null,
      priority: 2,
      estimated_minutes: null,
      suggested_date: suggestedDate || null,
      due_date: null,
      counts_as_habit: false,
      sort_order: nextSortOrder,
    }).catch(() => {});
    setSaving(false);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-xl border border-dashed border-border p-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título de la tarea" className="input" autoFocus />
      <div className="flex flex-wrap gap-1.5">
        {(Object.entries(TYPE_META) as [GoalTaskType, (typeof TYPE_META)[GoalTaskType]][]).map(([value, meta]) => (
          <button
            key={value}
            type="button"
            onClick={() => setType(value)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-medium",
              type === value ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground"
            )}
          >
            {meta.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        {subtopics.length > 0 && (
          <select value={subtopicId} onChange={(e) => setSubtopicId(e.target.value)} className="input flex-1">
            <option value="">Sin subtema</option>
            {subtopics.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        )}
        <input type="date" value={suggestedDate} onChange={(e) => setSuggestedDate(e.target.value)} className="input flex-1" />
      </div>
      <button type="submit" disabled={saving} className="btn-primary w-full">
        Agregar tarea
      </button>
    </form>
  );
}
