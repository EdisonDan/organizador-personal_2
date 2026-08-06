"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { NoteCard } from "@/components/notes/note-card";
import { NewNoteDialog } from "@/components/notes/new-note-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { extractPlainText } from "@/lib/notes/plain-text";
import { isDueForReview } from "@/lib/notes/spaced-repetition";
import type { Note, NoteReview, Subject } from "@/lib/types";

export function NotesClient({
  notes,
  reviews,
  subjects,
}: {
  notes: Note[];
  reviews: NoteReview[];
  subjects: Subject[];
}) {
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const reviewByNote = useMemo(() => new Map(reviews.map((r) => [r.note_id, r])), [reviews]);
  const subjectById = useMemo(() => new Map(subjects.map((s) => [s.id, s.name])), [subjects]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [notes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((n) => {
      if (tagFilter && !n.tags.includes(tagFilter)) return false;
      if (!q) return true;
      const haystack = `${n.title} ${extractPlainText(n.content)} ${n.tags.join(" ")}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [notes, query, tagFilter]);

  const dueToday = filtered.filter((n) => {
    const review = reviewByNote.get(n.id);
    return review && isDueForReview(review.next_review_at);
  });
  const rest = filtered.filter((n) => !dueToday.includes(n));

  if (notes.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Plus className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Todavía no tienes notas</p>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              Crea una nota normal, un set de tarjetas de repaso, o una nota Feynman.
            </p>
          </div>
          <button type="button" onClick={() => setShowNew(true)} className="btn-primary mt-1">
            <Plus className="h-4 w-4" />
            Nueva nota
          </button>
        </div>
        <NewNoteDialog open={showNew} onClose={() => setShowNew(false)} subjects={subjects} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en tus notas..."
            className="input pl-9"
          />
        </div>
        <button type="button" onClick={() => setShowNew(true)} className="btn-primary shrink-0">
          <Plus className="h-4 w-4" />
          Nueva nota
        </button>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <TagChip label="Todas" active={!tagFilter} onClick={() => setTagFilter(null)} />
          {allTags.map((tag) => (
            <TagChip key={tag} label={`#${tag}`} active={tagFilter === tag} onClick={() => setTagFilter(tag)} />
          ))}
        </div>
      )}

      {dueToday.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-foreground">Toca repasar hoy</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dueToday.map((note) => (
              <NoteCard key={note.id} note={note} subjectName={subjectById.get(note.subject_id ?? "")} dueForReview />
            ))}
          </div>
        </div>
      )}

      <div>
        {dueToday.length > 0 && <h2 className="mb-2 text-sm font-semibold text-foreground">Todas las notas</h2>}
        {rest.length === 0 ? (
          <EmptyState icon={Search} title="Sin resultados" description="Prueba con otra búsqueda o etiqueta." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((note) => (
              <NoteCard key={note.id} note={note} subjectName={subjectById.get(note.subject_id ?? "")} dueForReview={false} />
            ))}
          </div>
        )}
      </div>

      <NewNoteDialog open={showNew} onClose={() => setShowNew(false)} subjects={subjects} />
    </div>
  );
}

function TagChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        active ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );
}
