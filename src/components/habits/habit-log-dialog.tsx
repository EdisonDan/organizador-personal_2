"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, ImagePlus, Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { uploadHabitImage } from "@/lib/habits/upload-image";
import { upsertHabitLogDetail } from "@/app/(dashboard)/habits/actions";
import type { Habit, HabitLog } from "@/lib/types";

export function HabitLogDialog({
  open,
  onClose,
  userId,
  habit,
  date,
  existingLog,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  habit: Habit;
  date: string; // YYYY-MM-DD
  existingLog?: HabitLog | null;
}) {
  const isNegative = habit.type === "negative";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [completed, setCompleted] = useState(existingLog?.completed ?? false);
  const [value, setValue] = useState(existingLog?.value?.toString() ?? habit.goal_value?.toString() ?? "");
  const [note, setNote] = useState(existingLog?.note ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(existingLog?.photo_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadHabitImage(userId, file, `logs/${habit.id}`);
      setPhotoUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la foto.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await upsertHabitLogDetail(habit.id, date, {
        completed,
        value: value ? Number(value) : null,
        note: note.trim() || null,
        photo_url: photoUrl,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el registro.");
    } finally {
      setSaving(false);
    }
  }

  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Dialog open={open} onClose={onClose} title={habit.name}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm capitalize text-muted-foreground">{dateLabel}</p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCompleted(true)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              completed
                ? "border-primary bg-primary-soft text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {isNegative ? "Lo evité" : "Lo hice"}
          </button>
          <button
            type="button"
            onClick={() => setCompleted(false)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              !completed
                ? "border-destructive bg-destructive/10 text-destructive"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {isNegative ? "No lo evité" : "No lo hice"}
          </button>
        </div>

        {habit.goal_value != null && (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">
              Cantidad {habit.goal_unit ? `(${habit.goal_unit})` : ""}
            </span>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="input"
              placeholder={habit.goal_value?.toString()}
            />
          </label>
        )}

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">
            {isNegative && !completed ? "¿Qué pasó? (opcional, sin juzgarte)" : "Nota (opcional)"}
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input min-h-20 resize-none"
            placeholder={isNegative ? "Ej. día estresante en la universidad" : "Ej. me sentí con mucha energía"}
          />
        </label>

        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground">Foto de evidencia (opcional)</span>
          {photoUrl ? (
            <div className="relative h-32 w-full overflow-hidden rounded-lg border border-border">
              <Image src={photoUrl} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => setPhotoUrl(null)}
                className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white"
                aria-label="Quitar foto"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-secondary w-full"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              Agregar foto
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoPick}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar
          </button>
        </div>
      </form>
    </Dialog>
  );
}
