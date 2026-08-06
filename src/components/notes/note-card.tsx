import Link from "next/link";
import { FileText, Layers, Lightbulb, Clock } from "lucide-react";
import { snippet } from "@/lib/notes/plain-text";
import type { Note, NoteType } from "@/lib/types";

const TYPE_META: Record<NoteType, { label: string; icon: typeof FileText }> = {
  normal: { label: "Normal", icon: FileText },
  flashcards: { label: "Tarjetas", icon: Layers },
  feynman: { label: "Feynman", icon: Lightbulb },
};

export function NoteCard({
  note,
  subjectName,
  dueForReview,
}: {
  note: Note;
  subjectName?: string;
  dueForReview: boolean;
}) {
  const Icon = TYPE_META[note.note_type].icon;
  const text = snippet(note.content, 110);

  return (
    <Link
      href={`/notes/${note.id}`}
      className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-medium text-foreground">{note.title}</p>
        {dueForReview && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-medium text-gold">
            <Clock className="h-2.5 w-2.5" />
            Repasar
          </span>
        )}
      </div>

      {text && <p className="line-clamp-2 text-xs text-muted-foreground">{text}</p>}

      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          <Icon className="h-2.5 w-2.5" />
          {TYPE_META[note.note_type].label}
        </span>
        {subjectName && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {subjectName}
          </span>
        )}
        {note.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            #{tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
