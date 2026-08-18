"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, X, NotebookPen, Link2 } from "lucide-react";
import { linkExistingNote, unlinkNote, createNoteForGoal } from "@/app/(dashboard)/goals/actions";
import type { Goal, GoalNoteLink, Note, GoalSubtopic, NoteType } from "@/lib/types";

export function GoalNotesTab({
  goal,
  noteLinks,
  linkedNotesById,
  allNotes,
  subtopics,
}: {
  goal: Goal;
  noteLinks: GoalNoteLink[];
  linkedNotesById: Map<string, Note>;
  allNotes: Note[];
  subtopics: GoalSubtopic[];
}) {
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const linkedNoteIds = new Set(noteLinks.map((l) => l.note_id));
  const unlinkedNotes = allNotes.filter((n) => !linkedNoteIds.has(n.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Notas vinculadas</p>
        <div className="flex gap-2">
          <div className="relative">
            <button type="button" onClick={() => setShowLinkPicker((v) => !v)} className="btn-secondary text-xs">
              <Link2 className="h-3.5 w-3.5" />
              Vincular
            </button>
            {showLinkPicker && (
              <>
                <button type="button" className="fixed inset-0 z-40" aria-label="Cerrar" onClick={() => setShowLinkPicker(false)} />
                <div className="absolute right-0 z-50 mt-1 max-h-48 w-56 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-lg">
                  {unlinkedNotes.length === 0 ? (
                    <p className="p-3 text-xs text-muted-foreground">No hay notas disponibles.</p>
                  ) : (
                    unlinkedNotes.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          linkExistingNote(goal.id, n.id, null).catch(() => {});
                          setShowLinkPicker(false);
                        }}
                        className="block w-full truncate rounded-lg px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-muted"
                      >
                        {n.title}
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
          <button type="button" onClick={() => setShowCreate((v) => !v)} className="btn-primary text-xs">
            <Plus className="h-3.5 w-3.5" />
            Nueva nota
          </button>
        </div>
      </div>

      {showCreate && (
        <CreateNoteForm goal={goal} subtopics={subtopics} onDone={() => setShowCreate(false)} />
      )}

      {noteLinks.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Crea una nota desde aquí o vincula una existente para tenerla siempre a mano en este objetivo.
        </p>
      ) : (
        <ul className="space-y-2">
          {noteLinks.map((link) => {
            const note = linkedNotesById.get(link.note_id);
            if (!note) return null;
            return (
              <li key={link.id} className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3">
                <NotebookPen className="h-4 w-4 shrink-0 text-primary" />
                <Link href={`/notes/${note.id}`} className="min-w-0 flex-1 truncate text-sm text-foreground hover:text-primary">
                  {note.title}
                </Link>
                <button
                  type="button"
                  onClick={() => unlinkNote(link.id, goal.id).catch(() => {})}
                  aria-label="Desvincular"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function CreateNoteForm({
  goal,
  subtopics,
  onDone,
}: {
  goal: Goal;
  subtopics: GoalSubtopic[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("normal");
  const [subtopicId, setSubtopicId] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const noteId = await createNoteForGoal(goal.id, subtopicId || null, {
        title: title.trim(),
        note_type: noteType,
        subject_id: goal.subject_id,
      });
      onDone();
      router.push(`/notes/${noteId}`);
    } catch {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-xl border border-dashed border-border p-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título de la nota" className="input" autoFocus />
      <div className="flex gap-2">
        <select value={noteType} onChange={(e) => setNoteType(e.target.value as NoteType)} className="input flex-1">
          <option value="normal">Normal</option>
          <option value="flashcards">Tarjetas</option>
          <option value="feynman">Feynman</option>
        </select>
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
      </div>
      <button type="submit" disabled={saving} className="btn-primary w-full">
        Crear y abrir
      </button>
    </form>
  );
}
