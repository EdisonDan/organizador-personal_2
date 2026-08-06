"use client";

import { useState } from "react";
import { X, Check, RotateCcw } from "lucide-react";
import { markNoteReviewed } from "@/app/(dashboard)/notes/actions";
import type { Flashcard } from "@/lib/types";

export function FlashcardReview({
  noteId,
  currentStage,
  flashcards,
  onClose,
}: {
  noteId: string;
  currentStage: number;
  flashcards: Flashcard[];
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  const card = flashcards[index];
  const total = flashcards.length;

  async function handleAnswer(knewIt: boolean) {
    const next = [...results, knewIt];
    setResults(next);

    if (index + 1 < total) {
      setIndex(index + 1);
      setRevealed(false);
      return;
    }

    const allKnew = next.every(Boolean);
    setDone(true);
    await markNoteReviewed(noteId, currentStage, allKnew).catch(() => {});
  }

  if (done) {
    const correct = results.filter(Boolean).length;
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-2xl font-semibold text-foreground">
          <span className="tabular-stat">{correct}</span> / {total}
        </p>
        <p className="text-sm text-muted-foreground">
          {correct === total
            ? "Te las sabías todas. Se agendó tu próximo repaso más adelante."
            : "Se agendó repasar esta nota de nuevo mañana."}
        </p>
        <button type="button" onClick={onClose} className="btn-primary mt-2">
          Listo
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="tabular-stat text-xs text-muted-foreground">
          {index + 1} / {total}
        </span>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex min-h-40 flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-medium text-foreground">{card.question}</p>
        {revealed ? (
          <p className="rounded-xl bg-muted px-4 py-3 text-sm text-foreground">{card.answer}</p>
        ) : (
          <button type="button" onClick={() => setRevealed(true)} className="btn-secondary">
            Mostrar respuesta
          </button>
        )}
      </div>

      {revealed && (
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => handleAnswer(false)}
            className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            <RotateCcw className="h-4 w-4" />
            No la sabía
          </button>
          <button
            type="button"
            onClick={() => handleAnswer(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Check className="h-4 w-4" />
            La sabía
          </button>
        </div>
      )}
    </div>
  );
}
