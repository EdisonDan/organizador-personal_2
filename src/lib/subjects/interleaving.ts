export interface SuggestionTopic {
  id: string;
  title: string;
  weekNumber: number;
  dueDate: string | null;
}

export interface SubjectForSuggestions {
  id: string;
  name: string;
  color: string;
}

export interface StudySuggestion {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  topicId: string;
  topicTitle: string;
  weekNumber: number;
}

/**
 * Alterna entre materias distintas (interleaving) en vez de agrupar varias
 * sugerencias seguidas de la misma materia, que es lo que mejora la
 * retención a largo plazo según la investigación citada en el prompt.
 */
export function generateInterleavedSuggestions(
  subjects: SubjectForSuggestions[],
  topicsBySubject: Map<string, SuggestionTopic[]>,
  count: number
): StudySuggestion[] {
  const queues = subjects.map((subject) => ({
    subject,
    queue: [...(topicsBySubject.get(subject.id) ?? [])].sort((a, b) => {
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return a.weekNumber - b.weekNumber;
    }),
  }));

  const result: StudySuggestion[] = [];
  let cursor = 0;
  let emptyStreak = 0;

  while (result.length < count && emptyStreak < queues.length) {
    const entry = queues[cursor % queues.length];
    const topic = entry.queue.shift();
    if (topic) {
      result.push({
        subjectId: entry.subject.id,
        subjectName: entry.subject.name,
        subjectColor: entry.subject.color,
        topicId: topic.id,
        topicTitle: topic.title,
        weekNumber: topic.weekNumber,
      });
      emptyStreak = 0;
    } else {
      emptyStreak++;
    }
    cursor++;
  }

  return result;
}
