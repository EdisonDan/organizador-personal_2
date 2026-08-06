import type { SubjectTopic } from "@/lib/types";

export function subjectProgress(topics: SubjectTopic[]): { done: number; total: number; pct: number } {
  const total = topics.length;
  const done = topics.filter((t) => t.completed).length;
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}
