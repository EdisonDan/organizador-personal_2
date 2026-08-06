"use client";

import { useState } from "react";
import { Plus, CalendarClock, GraduationCap, FileText, CheckCircle2, Trash2 } from "lucide-react";
import { formatCountdown, isOverdue } from "@/lib/schedule/time";
import { createDeadline, toggleDeadline, deleteDeadline } from "@/app/(dashboard)/schedule/actions";
import type { Deadline, DeadlineType, Subject } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_META: Record<DeadlineType, { label: string; icon: typeof FileText }> = {
  exam: { label: "Examen", icon: GraduationCap },
  assignment: { label: "Entrega", icon: FileText },
  other: { label: "Otro", icon: CalendarClock },
};

export function DeadlineList({ deadlines, subjects }: { deadlines: Deadline[]; subjects: Subject[] }) {
  const [showForm, setShowForm] = useState(false);
  const today = new Date();

  const pending = deadlines
    .filter((d) => !d.completed)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Próximas entregas y exámenes</h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar
        </button>
      </div>

      {showForm && (
        <QuickAddForm subjects={subjects} onDone={() => setShowForm(false)} />
      )}

      {pending.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tienes entregas ni exámenes pendientes.</p>
      ) : (
        <ul className="space-y-2">
          {pending.map((d) => {
            const due = new Date(d.due_date);
            const overdue = isOverdue(due, today);
            const Icon = TYPE_META[d.type].icon;
            return (
              <li
                key={d.id}
                className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5"
              >
                <button
                  type="button"
                  onClick={() => toggleDeadline(d.id, true)}
                  aria-label="Marcar como completada"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-border text-transparent hover:border-primary hover:text-primary"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </button>
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{d.title}</p>
                  <p className="text-xs text-muted-foreground">{TYPE_META[d.type].label}</p>
                </div>
                <span
                  className={cn(
                    "tabular-stat shrink-0 rounded-full px-2 py-1 text-[11px] font-medium",
                    overdue ? "bg-destructive/10 text-destructive" : "bg-primary-soft text-primary"
                  )}
                >
                  {formatCountdown(due, today)}
                </span>
                <button
                  type="button"
                  onClick={() => deleteDeadline(d.id)}
                  aria-label="Eliminar"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function QuickAddForm({ subjects, onDone }: { subjects: Subject[]; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [type, setType] = useState<DeadlineType>("assignment");
  const [subjectId, setSubjectId] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;
    setSaving(true);
    await createDeadline({
      title: title.trim(),
      due_date: new Date(`${dueDate}T23:59:00`).toISOString(),
      type,
      subject_id: subjectId || null,
    }).catch(() => {});
    setSaving(false);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="mb-3 space-y-2 rounded-xl border border-dashed border-border p-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ej. Examen parcial de Bases de Datos"
        className="input"
      />
      <div className="flex gap-2">
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="input flex-1"
        />
        <select value={type} onChange={(e) => setType(e.target.value as DeadlineType)} className="input flex-1">
          <option value="assignment">Entrega</option>
          <option value="exam">Examen</option>
          <option value="other">Otro</option>
        </select>
      </div>
      {subjects.length > 0 && (
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="input">
          <option value="">Sin materia</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}
      <button type="submit" disabled={saving} className="btn-primary w-full">
        {saving ? "Guardando..." : "Agregar"}
      </button>
    </form>
  );
}
