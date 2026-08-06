"use client";

import { useState } from "react";
import { Loader2, FileText, Layers, Lightbulb } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { createNoteAndRedirect } from "@/app/(dashboard)/notes/actions";
import type { NoteType, Subject } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPES: { value: NoteType; label: string; desc: string; icon: typeof FileText }[] = [
  { value: "normal", label: "Normal", desc: "Texto libre enriquecido", icon: FileText },
  { value: "flashcards", label: "Tarjetas", desc: "Preguntas y respuestas para repasar", icon: Layers },
  { value: "feynman", label: "Feynman", desc: "Explícalo simple, detecta huecos", icon: Lightbulb },
];

export function NewNoteDialog({
  open,
  onClose,
  subjects,
  defaultSubjectId,
}: {
  open: boolean;
  onClose: () => void;
  subjects: Subject[];
  defaultSubjectId?: string;
}) {
  const [type, setType] = useState<NoteType>("normal");
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState(defaultSubjectId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Ponle un título a la nota.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createNoteAndRedirect({
        title: title.trim(),
        note_type: type,
        subject_id: subjectId || null,
        week_id: null,
      });
    } catch (err) {
      // NEXT_REDIRECT no es un error real: Next.js lo usa para navegar
      if (err instanceof Error && err.message === "NEXT_REDIRECT") return;
      setError(err instanceof Error ? err.message : "No se pudo crear la nota.");
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Nueva nota">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors",
                type === t.value ? "border-primary bg-primary-soft" : "border-border hover:bg-muted"
              )}
            >
              <t.icon className={cn("h-4 w-4", type === t.value ? "text-primary" : "text-muted-foreground")} />
              <span className="text-xs font-medium text-foreground">{t.label}</span>
              <span className="text-[10px] leading-tight text-muted-foreground">{t.desc}</span>
            </button>
          ))}
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Título</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="Ej. Normalización de bases de datos"
            autoFocus
          />
        </label>

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

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Crear nota
          </button>
        </div>
      </form>
    </Dialog>
  );
}
