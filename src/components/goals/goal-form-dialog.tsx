"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { IconPicker, HabitIcon } from "@/components/habits/icon-picker";
import { ColorPicker } from "@/components/habits/color-picker";
import { createGoal, updateGoal, type GoalInput } from "@/app/(dashboard)/goals/actions";
import type { Goal, Habit, Subject } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRIORITIES = [
  { value: 1, label: "Baja" },
  { value: 2, label: "Media" },
  { value: 3, label: "Alta" },
];

export function GoalFormDialog({
  open,
  onClose,
  habits,
  subjects,
  goal,
}: {
  open: boolean;
  onClose: () => void;
  habits: Habit[];
  subjects: Subject[];
  goal?: Goal;
}) {
  const isEdit = Boolean(goal);

  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [category, setCategory] = useState(goal?.category ?? "");
  const [icon, setIcon] = useState<string | null>(goal?.icon ?? "sparkles");
  const [color, setColor] = useState(goal?.color ?? "#0E7A72");
  const [priority, setPriority] = useState(goal?.priority ?? 2);
  const [startDate, setStartDate] = useState(goal?.start_date ?? new Date().toISOString().slice(0, 10));
  const [targetDate, setTargetDate] = useState(goal?.target_date ?? "");
  const [initialLevel, setInitialLevel] = useState(goal?.initial_level ?? 1);
  const [targetLevel, setTargetLevel] = useState(goal?.target_level ?? 5);
  const [habitId, setHabitId] = useState(goal?.primary_habit_id ?? "");
  const [subjectId, setSubjectId] = useState(goal?.subject_id ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Ponle un título al objetivo.");
      return;
    }
    setSaving(true);
    setError(null);

    const input: GoalInput = {
      title: title.trim(),
      description: description.trim() || null,
      category: category.trim() || null,
      color,
      icon,
      priority,
      start_date: startDate,
      target_date: targetDate || null,
      initial_level: initialLevel,
      target_level: targetLevel,
      primary_habit_id: habitId || null,
      subject_id: subjectId || null,
    };

    try {
      if (isEdit && goal) {
        await updateGoal(goal.id, input);
        onClose();
      } else {
        await createGoal(input);
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el objetivo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? "Editar objetivo" : "Nuevo objetivo"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Título</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="Ej. Aprender Python, Aprender Inglés"
            autoFocus
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Descripción (opcional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input min-h-16 resize-none"
            placeholder="¿Qué significa lograr esto para ti?"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Categoría</span>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
              placeholder="Programación, idiomas..."
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Prioridad</span>
            <select value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="input">
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-1 space-y-1.5">
            <span className="text-sm font-medium text-foreground">Ícono</span>
            <IconPicker value={icon} onChange={setIcon} />
          </div>
          <div className="mt-6 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}22` }}>
            <HabitIcon name={icon} className="h-5 w-5" style={{ color }} />
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-sm font-medium text-foreground">Color</span>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Inicio</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Meta (opcional)</span>
            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="input" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Nivel inicial (1-5)</span>
            <input
              type="number"
              min={1}
              max={5}
              value={initialLevel}
              onChange={(e) => setInitialLevel(Number(e.target.value))}
              className="input"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Nivel meta (1-5)</span>
            <input
              type="number"
              min={1}
              max={5}
              value={targetLevel}
              onChange={(e) => setTargetLevel(Number(e.target.value))}
              className="input"
            />
          </label>
        </div>

        {habits.length > 0 && (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Hábito principal (opcional)</span>
            <select value={habitId} onChange={(e) => setHabitId(e.target.value)} className="input">
              <option value="">Sin vincular</option>
              {habits.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {subjects.length > 0 && (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Materia relacionada (opcional)</span>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="input">
              <option value="">Sin vincular</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {error && <p className={cn("rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive")}>{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Guardar cambios" : "Crear objetivo"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
