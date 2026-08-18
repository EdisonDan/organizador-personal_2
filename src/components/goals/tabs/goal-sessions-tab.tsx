import { Timer, CalendarClock } from "lucide-react";
import { PomodoroTimer } from "@/components/schedule/pomodoro-timer";
import type { Goal, ScheduleBlock, PomodoroSession, Subject } from "@/lib/types";

export function GoalSessionsTab({
  goal,
  subjects,
  scheduleBlocks,
  pomodoroSessions,
}: {
  goal: Goal;
  subjects: Subject[];
  scheduleBlocks: ScheduleBlock[];
  pomodoroSessions: PomodoroSession[];
}) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = pomodoroSessions.filter((s) => new Date(s.started_at) >= weekAgo);
  const totalMinutes = pomodoroSessions.reduce((sum, s) => sum + s.duration_minutes, 0);

  const recentSessions = [...pomodoroSessions].sort((a, b) => b.started_at.localeCompare(a.started_at)).slice(0, 10);
  const studyBlocks = [...scheduleBlocks].filter((b) => b.block_type === "study");

  const bySubject = new Map<string, { subjectId: string | null; subjectName: string; count: number }>();
  for (const s of pomodoroSessions) {
    const key = s.subject_id ?? "none";
    if (!bySubject.has(key)) bySubject.set(key, { subjectId: s.subject_id, subjectName: subjects.find((sub) => sub.id === s.subject_id)?.name ?? "Sin materia", count: 0 });
    bySubject.get(key)!.count++;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <StatBox value={pomodoroSessions.length} label="Pomodoros totales" />
            <StatBox value={thisWeek.length} label="Esta semana" />
            <StatBox value={`${totalMinutes}`} label="Minutos totales" />
          </div>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Timer className="h-3.5 w-3.5 text-primary" />
              Sesiones recientes
            </h2>
            {recentSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay Pomodoros para &quot;{goal.title}&quot;. Usa el temporizador.</p>
            ) : (
              <ul className="space-y-1.5">
                {recentSessions.map((s) => (
                  <li key={s.id} className="tabular-stat flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {new Date(s.started_at).toLocaleDateString("es-EC", { day: "numeric", month: "short" })}
                    </span>
                    <span className="text-foreground">{s.duration_minutes} min</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {studyBlocks.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <CalendarClock className="h-3.5 w-3.5 text-primary" />
                Bloques de estudio vinculados
              </h2>
              <ul className="space-y-1.5">
                {studyBlocks.map((b) => (
                  <li key={b.id} className="tabular-stat text-sm text-foreground">
                    {b.title} · {b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <PomodoroTimer
          subjects={subjects}
          goals={[goal]}
          initialGoalId={goal.id}
          initialTodayCount={0}
          initialBySubject={Array.from(bySubject.values())}
        />
      </div>
    </div>
  );
}

function StatBox({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-2xl border border-border bg-card p-4 text-center">
      <p className="tabular-stat text-lg font-semibold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
