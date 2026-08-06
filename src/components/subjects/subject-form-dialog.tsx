"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, ImagePlus, Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { IconPicker, HabitIcon } from "@/components/habits/icon-picker";
import { ColorPicker } from "@/components/habits/color-picker";
import { uploadFile } from "@/lib/storage";
import { createSubject, updateSubject, type SubjectInput } from "@/app/(dashboard)/subjects/actions";
import type { Subject } from "@/lib/types";

export function SubjectFormDialog({
  open,
  onClose,
  userId,
  subject,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  subject?: Subject;
}) {
  const isEdit = Boolean(subject);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(subject?.name ?? "");
  const [icon, setIcon] = useState<string | null>(subject?.icon ?? "book-open");
  const [color, setColor] = useState(subject?.color ?? "#0E7A72");
  const [coverUrl, setCoverUrl] = useState<string | null>(subject?.cover_image_url ?? null);
  const [semesterLabel, setSemesterLabel] = useState(subject?.semester_label ?? "");
  const [semesterWeeks, setSemesterWeeks] = useState(subject?.semester_weeks ?? 16);
  const [startDate, setStartDate] = useState(subject?.semester_start_date ?? "");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCoverPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadFile(userId, file, "subjects");
      setCoverUrl(uploaded.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la portada.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Ponle un nombre a la materia.");
      return;
    }
    setSaving(true);
    setError(null);

    const input: SubjectInput = {
      name: name.trim(),
      color,
      icon: coverUrl ? null : icon,
      cover_image_url: coverUrl,
      semester_label: semesterLabel.trim() || null,
      semester_start_date: startDate || null,
      semester_weeks: semesterWeeks,
    };

    try {
      if (isEdit && subject) {
        await updateSubject(subject.id, input);
      } else {
        await createSubject(input);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la materia.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? "Editar materia" : "Nueva materia"}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Nombre</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Ej. Bases de Datos, Sistemas Digitales..."
          />
        </label>

        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground">Portada (opcional)</span>
          {coverUrl ? (
            <div className="relative h-24 w-full overflow-hidden rounded-xl border border-border">
              <Image src={coverUrl} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => setCoverUrl(null)}
                className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white"
                aria-label="Quitar portada"
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
              Subir imagen de portada
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverPick} />
        </div>

        {!coverUrl && (
          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-1.5">
              <span className="text-sm font-medium text-foreground">Ícono</span>
              <IconPicker value={icon} onChange={setIcon} />
            </div>
            <div
              className="mt-6 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${color}22` }}
            >
              <HabitIcon name={icon} className="h-5 w-5" style={{ color }} />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <span className="text-sm font-medium text-foreground">Color</span>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Semestre (opcional)</span>
          <input
            value={semesterLabel}
            onChange={(e) => setSemesterLabel(e.target.value)}
            className="input"
            placeholder="Ej. Semestre 5 - 2026"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Semanas del semestre</span>
            <input
              type="number"
              min={1}
              max={32}
              value={semesterWeeks}
              onChange={(e) => setSemesterWeeks(Number(e.target.value))}
              disabled={isEdit}
              className="input disabled:opacity-60"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Inicio (opcional)</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </label>
        </div>
        {isEdit && (
          <p className="text-xs text-muted-foreground">
            El número de semanas no se puede editar después de crear la materia, para no desordenar los temas ya guardados.
          </p>
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
            {isEdit ? "Guardar cambios" : "Crear materia"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
