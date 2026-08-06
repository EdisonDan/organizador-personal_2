"use client";

import { useMemo, useState } from "react";
import { Plus, Shuffle } from "lucide-react";
import { SubjectCard } from "@/components/subjects/subject-card";
import { SubjectFormDialog } from "@/components/subjects/subject-form-dialog";
import { subjectProgress } from "@/lib/subjects/progress";
import { generateInterleavedSuggestions, type SuggestionTopic } from "@/lib/subjects/interleaving";
import type { Subject, SubjectTopic } from "@/lib/types";

export function SubjectsClient({
  userId,
  subjects,
  topicsBySubject,
}: {
  userId: string;
  subjects: Subject[];
  topicsBySubject: Map<string, SubjectTopic[]>;
}) {
  const [showForm, setShowForm] = useState(false);

  const overall = useMemo(() => {
    const all = Array.from(topicsBySubject.values()).flat();
    return subjectProgress(all);
  }, [topicsBySubject]);

  const suggestions = useMemo(() => {
    const pending = new Map<string, SuggestionTopic[]>();
    for (const subject of subjects) {
      const topics = (topicsBySubject.get(subject.id) ?? [])
        .filter((t) => !t.completed)
        .map((t) => ({ id: t.id, title: t.title, weekNumber: 0, dueDate: t.due_date }));
      pending.set(subject.id, topics);
    }
    return generateInterleavedSuggestions(subjects, pending, 4);
  }, [subjects, topicsBySubject]);

  const subjectsBySemester = useMemo(() => {
    const map = new Map<string, Subject[]>();
    for (const subject of subjects) {
      const key = subject.semester_label?.trim() || "Sin semestre asignado";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(subject);
    }
    return map;
  }, [subjects]);

  if (subjects.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Plus className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Todavía no tienes materias</p>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              Crea tu primera materia y organiza su contenido semana por semana.
            </p>
          </div>
          <button type="button" onClick={() => setShowForm(true)} className="btn-primary mt-1">
            <Plus className="h-4 w-4" />
            Crear materia
          </button>
        </div>
        <SubjectFormDialog open={showForm} onClose={() => setShowForm(false)} userId={userId} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Progreso general del semestre</h2>
          <span className="tabular-stat text-sm font-semibold text-foreground">{overall.pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${overall.pct}%` }} />
        </div>
        <p className="tabular-stat mt-1 text-xs text-muted-foreground">
          {overall.done} de {overall.total} temas completados
        </p>
      </div>

      {suggestions.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Shuffle className="h-3.5 w-3.5 text-primary" />
            Qué estudiar hoy (intercalando materias)
          </h2>
          <ul className="space-y-1.5">
            {suggestions.map((s, i) => (
              <li key={s.topicId} className="flex items-center gap-2.5 text-sm">
                <span className="tabular-stat text-xs text-muted-foreground">{i + 1}</span>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: s.subjectColor }} />
                <span className="text-muted-foreground">{s.subjectName}:</span>
                <span className="truncate text-foreground">{s.topicTitle}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Tus materias</h2>
        <button type="button" onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Nueva materia
        </button>
      </div>

      {Array.from(subjectsBySemester.entries()).map(([semester, group]) => (
        <div key={semester} className="space-y-3">
          {subjectsBySemester.size > 1 && (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{semester}</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.map((subject) => {
              const progress = subjectProgress(topicsBySubject.get(subject.id) ?? []);
              return (
                <SubjectCard
                  key={subject.id}
                  id={subject.id}
                  name={subject.name}
                  color={subject.color}
                  icon={subject.icon}
                  coverUrl={subject.cover_image_url}
                  pct={progress.pct}
                  topicsDone={progress.done}
                  topicsTotal={progress.total}
                />
              );
            })}
          </div>
        </div>
      ))}

      <SubjectFormDialog open={showForm} onClose={() => setShowForm(false)} userId={userId} />
    </div>
  );
}
