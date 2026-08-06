"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { JSONContent } from "@tiptap/react";
import { Trash2, Tag, Link2, X, Check, Loader2 } from "lucide-react";
import { RichTextEditor } from "@/components/notes/rich-text-editor";
import { FlashcardEditor } from "@/components/notes/flashcard-editor";
import { FlashcardReview } from "@/components/notes/flashcard-review";
import { NoteReviewButton } from "@/components/notes/note-review-button";
import {
  updateNoteContent,
  updateNoteMeta,
  deleteNote,
  linkNotes,
  unlinkNotes,
} from "@/app/(dashboard)/notes/actions";
import { isDueForReview } from "@/lib/notes/spaced-repetition";
import type { Note, Flashcard, NoteReview, NoteLink, Subject } from "@/lib/types";

export function NoteDetailClient({
  note,
  flashcards,
  review,
  links,
  linkedNotes,
  otherNotes,
  subjects,
}: {
  note: Note;
  flashcards: Flashcard[];
  review: NoteReview | null;
  links: NoteLink[];
  linkedNotes: Note[];
  otherNotes: Note[];
  subjects: Subject[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [tags, setTags] = useState(note.tags);
  const [tagInput, setTagInput] = useState("");
  const [subjectId, setSubjectId] = useState(note.subject_id ?? "");
  const [content, setContent] = useState<JSONContent>((note.content as JSONContent) ?? {});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [showLinkPicker, setShowLinkPicker] = useState(false);

  const due = review ? isDueForReview(review.next_review_at) : true;

  async function handleSaveContent() {
    setSaving(true);
    await updateNoteContent(note.id, content).catch(() => {});
    setSaving(false);
    setDirty(false);
  }

  async function handleSaveMeta() {
    await updateNoteMeta(note.id, {
      title: title.trim() || "Sin título",
      tags,
      subject_id: subjectId || null,
      week_id: note.week_id,
    }).catch(() => {});
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || tags.includes(t)) return;
    const next = [...tags, t];
    setTags(next);
    setTagInput("");
    updateNoteMeta(note.id, { title, tags: next, subject_id: subjectId || null, week_id: note.week_id }).catch(() => {});
  }

  function removeTag(t: string) {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    updateNoteMeta(note.id, { title, tags: next, subject_id: subjectId || null, week_id: note.week_id }).catch(() => {});
  }

  async function handleDelete() {
    if (!confirm(`¿Borrar "${note.title}"? Esta acción no se puede deshacer.`)) return;
    await deleteNote(note.id);
    router.push("/notes");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setDirty(true);
          }}
          onBlur={handleSaveMeta}
          className="w-full flex-1 bg-transparent text-xl font-semibold tracking-tight text-foreground outline-none"
          placeholder="Título de la nota"
        />
        <button
          type="button"
          onClick={handleDelete}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          aria-label="Eliminar nota"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {subjects.length > 0 && (
          <select
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              updateNoteMeta(note.id, { title, tags, subject_id: e.target.value || null, week_id: note.week_id }).catch(
                () => {}
              );
            }}
            className="input w-auto text-xs"
          >
            <option value="">Sin materia</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        {tags.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
          >
            #{t}
            <button type="button" onClick={() => removeTag(t)} aria-label={`Quitar etiqueta ${t}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <div className="flex items-center gap-1">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="agregar etiqueta"
            className="w-28 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {note.note_type === "flashcards" ? (
        reviewing ? (
          <FlashcardReview
            noteId={note.id}
            currentStage={review?.interval_stage ?? 0}
            flashcards={flashcards}
            onClose={() => setReviewing(false)}
          />
        ) : (
          <FlashcardEditor noteId={note.id} flashcards={flashcards} onReview={() => setReviewing(true)} />
        )
      ) : (
        <div className="space-y-3">
          <RichTextEditor
            userId={note.user_id}
            content={content}
            onChange={(json) => {
              setContent(json);
              setDirty(true);
            }}
          />
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleSaveContent} disabled={saving || !dirty} className="btn-primary disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {dirty ? "Guardar cambios" : "Guardado"}
            </button>
            <NoteReviewButton
              noteId={note.id}
              currentStage={review?.interval_stage ?? 0}
              nextReviewAt={review?.next_review_at ?? note.created_at.slice(0, 10)}
              due={due}
            />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Link2 className="h-3.5 w-3.5" />
            Notas vinculadas
          </h2>
          <button
            type="button"
            onClick={() => setShowLinkPicker((v) => !v)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Vincular nota
          </button>
        </div>

        {showLinkPicker && (
          <div className="mb-3 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
            {otherNotes.length === 0 ? (
              <p className="p-2 text-xs text-muted-foreground">No tienes otras notas todavía.</p>
            ) : (
              otherNotes.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    linkNotes(note.id, n.id).catch(() => {});
                    setShowLinkPicker(false);
                  }}
                  className="block w-full truncate rounded-md px-2 py-1.5 text-left text-xs text-foreground hover:bg-muted"
                >
                  {n.title}
                </button>
              ))
            )}
          </div>
        )}

        {linkedNotes.length === 0 ? (
          <p className="text-xs text-muted-foreground">Todavía no hay notas vinculadas.</p>
        ) : (
          <ul className="space-y-1">
            {linkedNotes.map((n) => {
              const link = links.find((l) => l.to_note_id === n.id || l.from_note_id === n.id);
              return (
                <li key={n.id} className="flex items-center justify-between gap-2">
                  <Link href={`/notes/${n.id}`} className="truncate text-xs text-primary hover:underline">
                    {n.title}
                  </Link>
                  {link && (
                    <button
                      type="button"
                      onClick={() => unlinkNotes(link.id, note.id).catch(() => {})}
                      aria-label="Quitar vínculo"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
