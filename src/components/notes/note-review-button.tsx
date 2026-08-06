"use client";

import { useState } from "react";
import { Check, RotateCcw, Clock } from "lucide-react";
import { markNoteReviewed } from "@/app/(dashboard)/notes/actions";
import { formatCountdown } from "@/lib/schedule/time";

export function NoteReviewButton({
  noteId,
  currentStage,
  nextReviewAt,
  due,
}: {
  noteId: string;
  currentStage: number;
  nextReviewAt: string;
  due: boolean;
}) {
  const [asking, setAsking] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handle(success: boolean) {
    setSaving(true);
    await markNoteReviewed(noteId, currentStage, success).catch(() => {});
    setSaving(false);
    setAsking(false);
  }

  if (asking) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
        <span className="text-sm text-foreground">¿Te acordabas bien del tema?</span>
        <button
          type="button"
          disabled={saving}
          onClick={() => handle(false)}
          className="flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          No tanto
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => handle(true)}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          <Check className="h-3.5 w-3.5" />
          Sí, bien
        </button>
      </div>
    );
  }

  return (
    <button type="button" onClick={() => setAsking(true)} className={due ? "btn-primary" : "btn-secondary"}>
      <Clock className="h-4 w-4" />
      {due ? "Marcar como repasada" : `Repasada · próxima: ${formatCountdown(new Date(nextReviewAt + "T00:00:00"))}`}
    </button>
  );
}
