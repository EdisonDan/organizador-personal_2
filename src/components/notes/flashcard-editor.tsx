"use client";

import { useState } from "react";
import { Plus, Trash2, Play } from "lucide-react";
import { addFlashcard, deleteFlashcard } from "@/app/(dashboard)/notes/actions";
import type { Flashcard } from "@/lib/types";

export function FlashcardEditor({
  noteId,
  flashcards,
  onReview,
}: {
  noteId: string;
  flashcards: Flashcard[];
  onReview: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    setSaving(true);
    await addFlashcard(noteId, question.trim(), answer.trim(), flashcards.length).catch(() => {});
    setQuestion("");
    setAnswer("");
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Tarjetas <span className="tabular-stat text-muted-foreground">({flashcards.length})</span>
        </h2>
        {flashcards.length > 0 && (
          <button type="button" onClick={onReview} className="btn-primary">
            <Play className="h-4 w-4" />
            Modo repaso
          </button>
        )}
      </div>

      {flashcards.length > 0 && (
        <ul className="space-y-2">
          {flashcards.map((card) => (
            <li key={card.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-medium text-foreground">{card.question}</p>
                <p className="text-sm text-muted-foreground">{card.answer}</p>
              </div>
              <button
                type="button"
                onClick={() => deleteFlashcard(card.id, noteId)}
                aria-label="Eliminar tarjeta"
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="space-y-2 rounded-xl border border-dashed border-border p-3">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Pregunta"
          className="input"
        />
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Respuesta"
          className="input"
        />
        <button type="submit" disabled={saving} className="btn-secondary w-full">
          <Plus className="h-4 w-4" />
          Agregar tarjeta
        </button>
      </form>
    </div>
  );
}
