"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Pencil, Archive, Trash2 } from "lucide-react";
import { HabitIcon } from "@/components/habits/icon-picker";
import { WeekAccordion } from "@/components/subjects/week-accordion";
import { SubjectFormDialog } from "@/components/subjects/subject-form-dialog";
import { DeadlineList } from "@/components/schedule/deadline-list";
import { subjectProgress } from "@/lib/subjects/progress";
import { archiveSubject, deleteSubject } from "@/app/(dashboard)/subjects/actions";
import type { Subject, SubjectWeek, SubjectTopic, Note, ScheduleBlock, Deadline } from "@/lib/types";

export function SubjectDetailClient({
  userId,
  subject,
  weeks,
  topics,
  notes,
  blocks,
  deadlines,
  availableNotes,
  availableBlocks,
}: {
  userId: string;
  subject: Subject;
  weeks: SubjectWeek[];
  topics: SubjectTopic[];
  notes: Note[];
  blocks: ScheduleBlock[];
  deadlines: Deadline[];
  availableNotes: Note[];
  availableBlocks: ScheduleBlock[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const progress = subjectProgress(topics);

  const topicsByWeek = new Map<string, SubjectTopic[]>();
  for (const week of weeks) {
    topicsByWeek.set(
      week.id,
      topics.filter((t) => t.week_id === week.id).sort((a, b) => a.sort_order - b.sort_order)
    );
  }

  const notesByTopic = new Map<string, Note>();
  for (const note of notes) {
    if (note.topic_id) notesByTopic.set(note.topic_id, note);
  }

  const blocksByTopic = new Map<string, ScheduleBlock[]>();
  for (const block of blocks) {
    if (block.topic_id) {
      if (!blocksByTopic.has(block.topic_id)) blocksByTopic.set(block.topic_id, []);
      blocksByTopic.get(block.topic_id)!.push(block);
    }
  }

  async function handleArchive() {
    setBusy(true);
    await archiveSubject(subject.id, !subject.archived);
    setBusy(false);
    router.push("/subjects");
  }

  async function handleDelete() {
    if (!confirm(`¿Borrar "${subject.name}" y todo su contenido? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    await deleteSubject(subject.id);
    router.push("/subjects");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl"
            style={{ backgroundColor: subject.cover_image_url ? undefined : `${subject.color}22` }}
          >
            {subject.cover_image_url ? (
              <Image src={subject.cover_image_url} alt="" fill className="object-cover" />
            ) : (
              <HabitIcon name={subject.icon} className="h-6 w-6" style={{ color: subject.color }} />
            )}
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{subject.name}</h1>
            <p className="tabular-stat text-sm text-muted-foreground">
              {progress.done}/{progress.total} temas · {progress.pct}%
            </p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
            aria-label="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleArchive}
            disabled={busy}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-60"
            aria-label="Archivar"
          >
            <Archive className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-destructive hover:bg-destructive/10 disabled:opacity-60"
            aria-label="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${progress.pct}%`, backgroundColor: subject.color }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <WeekAccordion
          subjectId={subject.id}
          weeks={weeks}
          topicsByWeek={topicsByWeek}
          notesByTopic={notesByTopic}
          blocksByTopic={blocksByTopic}
          availableNotes={availableNotes}
          availableBlocks={availableBlocks}
        />

        <DeadlineList deadlines={deadlines} subjects={[subject]} />
      </div>

      <SubjectFormDialog open={editOpen} onClose={() => setEditOpen(false)} userId={userId} subject={subject} />
    </div>
  );
}
