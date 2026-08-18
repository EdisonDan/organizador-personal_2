"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { createSubtopic, updateSubtopicStatus, deleteSubtopic } from "@/app/(dashboard)/goals/actions";
import { cn } from "@/lib/utils";
import type { Goal, GoalSubtopic, SubtopicStatus } from "@/lib/types";

const STATUS_META: Record<SubtopicStatus, { label: string; color: string }> = {
  no_iniciado: { label: "No iniciado", color: "bg-muted-foreground/40" },
  entendiendo: { label: "Entendiendo", color: "bg-[#DB4C77]" },
  practicando: { label: "Practicando", color: "bg-gold" },
  consolidado: { label: "Consolidado", color: "bg-primary" },
};

const STATUS_ORDER: SubtopicStatus[] = ["no_iniciado", "entendiendo", "practicando", "consolidado"];

export function GoalSubtopicsTab({ goal, subtopics }: { goal: Goal; subtopics: GoalSubtopic[] }) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const ordered = [...subtopics].sort((a, b) => a.sort_order - b.sort_order);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await createSubtopic(goal.id, {
      title: title.trim(),
      description: null,
      difficulty: null,
      estimated_minutes: null,
      sort_order: subtopics.length,
    }).catch(() => {});
    setTitle("");
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      {ordered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Divide &quot;{goal.title}&quot; en subtemas (ej. para Python: Variables, Condicionales, Bucles, Funciones).
        </p>
      ) : (
        <ul className="space-y-2">
          {ordered.map((subtopic) => (
            <li key={subtopic.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-2.5">
                <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{subtopic.title}</p>
                <button
                  type="button"
                  onClick={() => deleteSubtopic(subtopic.id, goal.id).catch(() => {})}
                  aria-label="Eliminar subtema"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {STATUS_ORDER.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => updateSubtopicStatus(subtopic.id, goal.id, status).catch(() => {})}
                    className={cn(
                      "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                      subtopic.status === status
                        ? "border-transparent text-white"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                    style={subtopic.status === status ? { backgroundColor: colorForStatus(status) } : undefined}
                  >
                    {STATUS_META[status].label}
                  </button>
                ))}
              </div>
              {subtopic.invested_minutes > 0 && (
                <p className="tabular-stat mt-1.5 text-[11px] text-muted-foreground">
                  {subtopic.invested_minutes} min invertidos
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex gap-2 rounded-xl border border-dashed border-border p-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nuevo subtema..."
          className="input flex-1"
        />
        <button type="submit" disabled={saving} className="btn-secondary shrink-0 px-3">
          <Plus className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

function colorForStatus(status: SubtopicStatus) {
  return { no_iniciado: "#9AA79F", entendiendo: "#DB4C77", practicando: "#C99A2E", consolidado: "#0E7A72" }[status];
}
