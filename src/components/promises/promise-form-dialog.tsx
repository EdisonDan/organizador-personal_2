"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { createPromise, updatePromise, type PromiseInput } from "@/app/(dashboard)/promises/actions";
import type { Habit, PromiseType, Promise_ } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPES: { value: PromiseType; label: string }[] = [
  { value: "yearly", label: "Del año" },
  { value: "change", label: "De cambio" },
  { value: "creative", label: "Creativa" },
  { value: "personal", label: "Personal" },
];

export function PromiseFormDialog({
  open,
  onClose,
  habits,
  promise,
}: {
  open: boolean;
  onClose: () => void;
  habits: Habit[];
  promise?: Promise_;
}) {
  const isEdit = Boolean(promise);

  const [title, setTitle] = useState(promise?.title ?? "");
  const [description, setDescription] = useState(promise?.description ?? "");
  const [type, setType] = useState<PromiseType>(promise?.type ?? "personal");
  const [ideas, setIdeas] = useState(promise?.ideas ?? "");
  const [habitId, setHabitId] = useState(promise?.related_habit_id ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Ponle un título a la promesa.");
      return;
    }
    setSaving(true);
    setError(null);

    const input: PromiseInput = {
      title: title.trim(),
      description: description.trim() || null,
      type,
      ideas: ideas.trim() || null,
      related_goal_id: promise?.related_goal_id ?? null,
      related_habit_id: habitId || null,
    };

    try {
      if (isEdit && promise) {
        await updatePromise(promise.id, input);
      } else {
        await createPromise(input);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la promesa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? "Editar promesa" : "Nueva promesa"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-foreground">Tipo</span>
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  type === t.value
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Título</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="Ej. Aprender a andar en patines este año"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Descripción (opcional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input min-h-16 resize-none"
            placeholder="¿Por qué te importa esta promesa?"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Ideas de apoyo (opcional)</span>
          <textarea
            value={ideas}
            onChange={(e) => setIdeas(e.target.value)}
            className="input min-h-16 resize-none"
            placeholder="Ej. inspirarme en Pinterest, ver tutoriales..."
          />
        </label>

        {habits.length > 0 && (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Hábito relacionado (opcional)</span>
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

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Guardar cambios" : "Crear promesa"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
