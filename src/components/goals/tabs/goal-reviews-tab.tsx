"use client";

import { useState } from "react";
import { RotateCcw, Check, Clock } from "lucide-react";
import { isDueForReview } from "@/lib/notes/spaced-repetition";
import { markSubtopicReviewed } from "@/app/(dashboard)/goals/actions";
import { formatCountdown } from "@/lib/schedule/time";
import type { Goal, GoalSubtopic, GoalReview } from "@/lib/types";

export function GoalReviewsTab({ goal, subtopics, reviews }: { goal: Goal; subtopics: GoalSubtopic[]; reviews: GoalReview[] }) {
  const reviewBySubtopic = new Map(reviews.map((r) => [r.subtopic_id, r]));
  const today = new Date();

  const due = subtopics.filter((s) => {
    const r = reviewBySubtopic.get(s.id);
    return r && isDueForReview(r.next_review_at, today);
  });
  const upcoming = subtopics
    .filter((s) => !due.includes(s) && reviewBySubtopic.has(s.id))
    .sort((a, b) => (reviewBySubtopic.get(a.id)?.next_review_at ?? "").localeCompare(reviewBySubtopic.get(b.id)?.next_review_at ?? ""));

  return (
    <div className="space-y-5">
      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Toca repasar hoy <span className="tabular-stat text-muted-foreground">({due.length})</span>
        </h2>
        {due.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
            Nada pendiente de repaso por ahora.
          </p>
        ) : (
          <div className="space-y-2">
            {due.map((s) => (
              <ReviewRow key={s.id} goal={goal} subtopic={s} review={reviewBySubtopic.get(s.id)!} />
            ))}
          </div>
        )}
      </section>

      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">Próximos repasos</h2>
          <ul className="space-y-1.5">
            {upcoming.map((s) => {
              const review = reviewBySubtopic.get(s.id)!;
              return (
                <li key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-sm">
                  <span className="text-foreground">{s.title}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatCountdown(new Date(review.next_review_at + "T00:00:00"), today)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function ReviewRow({ goal, subtopic, review }: { goal: Goal; subtopic: GoalSubtopic; review: GoalReview }) {
  const [asking, setAsking] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handle(success: boolean) {
    setSaving(true);
    await markSubtopicReviewed(subtopic.id, goal.id, review.interval_stage, success).catch(() => {});
    setSaving(false);
    setAsking(false);
  }

  return (
    <div className="rounded-xl border border-gold/30 bg-gold-soft p-3">
      <p className="text-sm font-medium text-foreground">{subtopic.title}</p>
      {asking ? (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => handle(false)}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            No tanto
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handle(true)}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            <Check className="h-3.5 w-3.5" />
            Sí, bien
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setAsking(true)} className="btn-secondary mt-2 text-xs">
          Repasar ahora
        </button>
      )}
    </div>
  );
}
