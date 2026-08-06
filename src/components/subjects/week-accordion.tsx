"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Plus, Trash2, NotebookPen, CalendarClock, X } from "lucide-react";
import {
  createTopic,
  toggleTopic,
  deleteTopic,
  updateWeekTitle,
  linkTopicToNote,
  unlinkTopicFromNote,
  linkTopicToBlock,
  unlinkTopicFromBlock,
} from "@/app/(dashboard)/subjects/actions";
import { cn } from "@/lib/utils";
import type { SubjectWeek, SubjectTopic, Note, ScheduleBlock } from "@/lib/types";

export function WeekAccordion({
  subjectId,
  weeks,
  topicsByWeek,
  notesByTopic,
  blocksByTopic,
  availableNotes,
  availableBlocks,
  defaultExpandedWeekId,
}: {
  subjectId: string;
  weeks: SubjectWeek[];
  topicsByWeek: Map<string, SubjectTopic[]>;
  notesByTopic: Map<string, Note>;
  blocksByTopic: Map<string, ScheduleBlock[]>;
  availableNotes: Note[];
  availableBlocks: ScheduleBlock[];
  defaultExpandedWeekId?: string;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set([defaultExpandedWeekId ?? weeks[0]?.id].filter(Boolean) as string[])
  );

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const midpoint = Math.ceil(weeks.length / 2);
  const parciales = [
    { label: "Primer parcial", weeks: weeks.slice(0, midpoint) },
    { label: "Segundo parcial", weeks: weeks.slice(midpoint) },
  ].filter((p) => p.weeks.length > 0);

  return (
    <div className="space-y-5">
      {parciales.map((parcial) => {
        const parcialTopics = parcial.weeks.flatMap((w) => topicsByWeek.get(w.id) ?? []);
        const parcialDone = parcialTopics.filter((t) => t.completed).length;

        return (
          <div key={parcial.label}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{parcial.label}</h3>
              {parcialTopics.length > 0 && (
                <span className="tabular-stat text-xs text-muted-foreground">
                  {parcialDone}/{parcialTopics.length} temas
                </span>
              )}
            </div>
            <div className="space-y-2">
              {parcial.weeks.map((week) => (
                <WeekCard
                  key={week.id}
                  week={week}
                  subjectId={subjectId}
                  topics={topicsByWeek.get(week.id) ?? []}
                  notesByTopic={notesByTopic}
                  blocksByTopic={blocksByTopic}
                  availableNotes={availableNotes}
                  availableBlocks={availableBlocks}
                  isOpen={expanded.has(week.id)}
                  onToggle={() => toggle(week.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeekCard({
  week,
  subjectId,
  topics,
  notesByTopic,
  blocksByTopic,
  availableNotes,
  availableBlocks,
  isOpen,
  onToggle,
}: {
  week: SubjectWeek;
  subjectId: string;
  topics: SubjectTopic[];
  notesByTopic: Map<string, Note>;
  blocksByTopic: Map<string, ScheduleBlock[]>;
  availableNotes: Note[];
  availableBlocks: ScheduleBlock[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const done = topics.filter((t) => t.completed).length;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="tabular-stat text-xs font-medium text-muted-foreground">
            Semana {week.week_number}
          </span>
          <span className="text-sm font-medium text-foreground">{week.title || "Sin título"}</span>
        </div>
        <div className="flex items-center gap-2">
          {topics.length > 0 && (
            <span className="tabular-stat text-xs text-muted-foreground">
              {done}/{topics.length}
            </span>
          )}
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border p-4">
          <WeekTitleInput weekId={week.id} subjectId={subjectId} initialTitle={week.title ?? ""} />

          <ul className="mt-3 space-y-2">
            {topics.map((topic) => (
              <TopicRow
                key={topic.id}
                topic={topic}
                subjectId={subjectId}
                linkedNote={notesByTopic.get(topic.id)}
                linkedBlocks={blocksByTopic.get(topic.id) ?? []}
                availableNotes={availableNotes}
                availableBlocks={availableBlocks}
              />
            ))}
          </ul>

          <AddTopicForm weekId={week.id} subjectId={subjectId} nextSortOrder={topics.length} />
        </div>
      )}
    </div>
  );
}

function WeekTitleInput({
  weekId,
  subjectId,
  initialTitle,
}: {
  weekId: string;
  subjectId: string;
  initialTitle: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  return (
    <input
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={() => updateWeekTitle(weekId, title, subjectId).catch(() => {})}
      placeholder="Título de la semana (ej. Modelo entidad-relación)"
      className="w-full border-b border-dashed border-border bg-transparent pb-1 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
    />
  );
}

function AddTopicForm({ weekId, subjectId, nextSortOrder }: { weekId: string; subjectId: string; nextSortOrder: number }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await createTopic(weekId, subjectId, {
      title: title.trim(),
      description: null,
      due_date: dueDate || null,
      sort_order: nextSortOrder,
    }).catch(() => {});
    setTitle("");
    setDueDate("");
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nuevo tema o lectura..."
        className="input flex-1"
      />
      <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input w-36" />
      <button type="submit" disabled={saving} className="btn-secondary shrink-0 px-3">
        <Plus className="h-4 w-4" />
      </button>
    </form>
  );
}

function TopicRow({
  topic,
  subjectId,
  linkedNote,
  linkedBlocks,
  availableNotes,
  availableBlocks,
}: {
  topic: SubjectTopic;
  subjectId: string;
  linkedNote?: Note;
  linkedBlocks: ScheduleBlock[];
  availableNotes: Note[];
  availableBlocks: ScheduleBlock[];
}) {
  const [notePicker, setNotePicker] = useState(false);
  const [blockPicker, setBlockPicker] = useState(false);

  return (
    <li className="rounded-lg border border-border p-2.5">
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={() => toggleTopic(topic.id, !topic.completed, subjectId)}
          aria-pressed={topic.completed}
          className={cn(
            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
            topic.completed ? "border-primary bg-primary" : "border-border"
          )}
        >
          {topic.completed && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
        </button>

        <div className="min-w-0 flex-1">
          <p className={cn("text-sm text-foreground", topic.completed && "text-muted-foreground line-through")}>
            {topic.title}
          </p>
          {topic.due_date && (
            <p className="tabular-stat text-[11px] text-muted-foreground">Vence {topic.due_date}</p>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {linkedNote ? (
              <Link
                href={`/notes/${linkedNote.id}`}
                className="flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-medium text-primary"
              >
                <NotebookPen className="h-2.5 w-2.5" />
                {linkedNote.title}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    unlinkTopicFromNote(linkedNote.id, subjectId).catch(() => {});
                  }}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Link>
            ) : (
              <PickerButton
                label="Vincular nota"
                icon={NotebookPen}
                open={notePicker}
                onToggle={() => setNotePicker((v) => !v)}
                options={availableNotes.map((n) => ({ id: n.id, label: n.title }))}
                onSelect={(id) => {
                  linkTopicToNote(id, topic.id, subjectId).catch(() => {});
                  setNotePicker(false);
                }}
              />
            )}

            {linkedBlocks.map((block) => (
              <span
                key={block.id}
                className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                <CalendarClock className="h-2.5 w-2.5" />
                {block.title}
                <button type="button" onClick={() => unlinkTopicFromBlock(block.id, subjectId).catch(() => {})}>
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            <PickerButton
              label="Vincular bloque"
              icon={CalendarClock}
              open={blockPicker}
              onToggle={() => setBlockPicker((v) => !v)}
              options={availableBlocks.map((b) => ({ id: b.id, label: b.title }))}
              onSelect={(id) => {
                linkTopicToBlock(id, topic.id, subjectId).catch(() => {});
                setBlockPicker(false);
              }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => deleteTopic(topic.id, subjectId).catch(() => {})}
          aria-label="Eliminar tema"
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

function PickerButton({
  label,
  icon: Icon,
  open,
  onToggle,
  options,
  onSelect,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  open: boolean;
  onToggle: () => void;
  options: { id: string; label: string }[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted"
      >
        <Icon className="h-2.5 w-2.5" />
        {label}
      </button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40" aria-label="Cerrar" onClick={onToggle} />
          <div className="absolute left-0 z-50 mt-1 max-h-40 w-48 overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg">
            {options.length === 0 ? (
              <p className="p-2 text-[11px] text-muted-foreground">Nada disponible todavía.</p>
            ) : (
              options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onSelect(o.id)}
                  className="block w-full truncate rounded-md px-2 py-1 text-left text-[11px] text-foreground hover:bg-muted"
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
