"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import {
  createScheduleBlock,
  updateScheduleBlock,
  deleteScheduleBlock,
  type ScheduleBlockInput,
} from "@/app/(dashboard)/schedule/actions";
import type { BlockType, ScheduleBlock, Subject, Habit } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPES: { value: BlockType; label: string; color: string }[] = [
  { value: "class", label: "Clase", color: "#2563EB" },
  { value: "study", label: "Estudio", color: "#0E7A72" },
  { value: "habit", label: "Hábito", color: "#C99A2E" },
  { value: "break", label: "Descanso", color: "#7C3AED" },
];

const DIA_NOMBRES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function BlockFormDialog({
  open,
  onClose,
  defaultDay,
  defaultStart,
  defaultEnd,
  block,
  subjects,
  habits,
}: {
  open: boolean;
  onClose: () => void;
  defaultDay?: { dayOfWeek: number; dateKey: string };
  defaultStart?: string;
  defaultEnd?: string;
  block?: ScheduleBlock;
  subjects: Subject[];
  habits: Habit[];
}) {
  const isEdit = Boolean(block);

  const [title, setTitle] = useState(block?.title ?? "");
  const [type, setType] = useState<BlockType>(block?.block_type ?? "study");
  const [startTime, setStartTime] = useState((block?.start_time ?? defaultStart ?? "08:00:00").slice(0, 5));
  const [endTime, setEndTime] = useState((block?.end_time ?? defaultEnd ?? "09:00:00").slice(0, 5));
  const [repeats, setRepeats] = useState(block?.repeats ?? true);
  const [dayOfWeek, setDayOfWeek] = useState(block?.day_of_week ?? defaultDay?.dayOfWeek ?? 1);
  const [subjectId, setSubjectId] = useState(block?.subject_id ?? "");
  const [habitId, setHabitId] = useState(block?.habit_id ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedType = TYPES.find((t) => t.value === type)!;
  const dateKey = block?.specific_date ?? defaultDay?.dateKey ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Ponle un título al bloque.");
      return;
    }
    if (endTime <= startTime) {
      setError("La hora de fin debe ser después de la hora de inicio.");
      return;
    }
    setSaving(true);
    setError(null);

    const input: ScheduleBlockInput = {
      title: title.trim(),
      block_type: type,
      day_of_week: repeats ? dayOfWeek : null,
      specific_date: repeats ? null : dateKey || null,
      start_time: `${startTime}:00`,
      end_time: `${endTime}:00`,
      repeats,
      subject_id: subjectId || null,
      habit_id: habitId || null,
      color: selectedType.color,
    };

    try {
      if (isEdit && block) {
        await updateScheduleBlock(block.id, input);
      } else {
        await createScheduleBlock(input);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el bloque.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!block) return;
    if (!confirm(`¿Borrar "${block.title}"?`)) return;
    setSaving(true);
    await deleteScheduleBlock(block.id);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? "Editar bloque" : "Nuevo bloque"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Título</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="Ej. Bases de Datos, Estudiar Sistemas Digitales..."
          />
        </label>

        <div className="space-y-1.5">
          <span className="text-sm font-medium text-foreground">Tipo</span>
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  type === t.value ? "border-transparent text-white" : "border-border text-muted-foreground hover:bg-muted"
                )}
                style={type === t.value ? { backgroundColor: t.color } : undefined}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Inicio</span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Fin</span>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input" />
          </label>
        </div>

        <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
          <div>
            <span className="text-sm font-medium text-foreground">Se repite cada semana</span>
            <p className="text-xs text-muted-foreground">Útil para horario fijo de clases</p>
          </div>
          <input
            type="checkbox"
            checked={repeats}
            onChange={(e) => setRepeats(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
        </label>

        {repeats && (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Día de la semana</span>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="input"
            >
              {DIA_NOMBRES.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        )}

        {subjects.length > 0 && (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Materia (opcional)</span>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="input">
              <option value="">Sin materia</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {type === "habit" && habits.length > 0 && (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Hábito (opcional)</span>
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

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          {isEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 disabled:opacity-60"
              aria-label="Eliminar bloque"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear bloque"}
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
