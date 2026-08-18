import { Clock, Flame, AlertTriangle } from "lucide-react";
import { calculateGoalStats } from "@/lib/goals/stats";
import { subtopicsSummary } from "@/lib/goals/progress";
import type { Goal, GoalSubtopic, GoalTask, GoalReview, PomodoroSession } from "@/lib/types";

export function GoalSummaryTab({
  goal,
  subtopics,
  tasks,
  reviews,
  pomodoroSessions,
}: {
  goal: Goal;
  subtopics: GoalSubtopic[];
  tasks: GoalTask[];
  reviews: GoalReview[];
  pomodoroSessions: PomodoroSession[];
}) {
  const stats = calculateGoalStats(subtopics, tasks, reviews, pomodoroSessions);
  const summary = subtopicsSummary(subtopics);

  return (
    <div className="space-y-4">
      {goal.description && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Sobre este objetivo</h2>
          <p className="text-sm text-muted-foreground">{goal.description}</p>
          {(goal.initial_level || goal.target_level) && (
            <p className="tabular-stat mt-3 text-xs text-muted-foreground">
              Nivel {goal.initial_level ?? "?"} → {goal.target_level ?? "?"}
              {goal.target_date && ` · meta: ${goal.target_date}`}
            </p>
          )}
        </section>
      )}

      <div className="grid grid-cols-3 gap-3">
        <StatBox icon={Clock} label="Esta semana" value={`${stats.minutesThisWeek} min`} />
        <StatBox icon={Flame} label="Racha de estudio" value={`${stats.studyStreak.current} días`} />
        <StatBox
          icon={AlertTriangle}
          label="Sin actividad"
          value={stats.daysSinceActivity === null ? "—" : `${stats.daysSinceActivity} días`}
        />
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Plan de estudio</h2>
        {subtopics.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no divides este objetivo en subtemas. Ve a la pestaña &quot;Subtemas&quot; para armar tu plan.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="flex h-2 overflow-hidden rounded-full bg-muted">
              {(["consolidado", "practicando", "entendiendo", "no_iniciado"] as const).map((key) => {
                const width = summary.total ? (summary[key] / summary.total) * 100 : 0;
                if (width === 0) return null;
                return <div key={key} className={SEGMENT_COLOR[key]} style={{ width: `${width}%` }} />;
              })}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <Legend color="bg-primary" label={`${summary.consolidado} consolidados`} />
              <Legend color="bg-gold" label={`${summary.practicando} practicando`} />
              <Legend color="bg-[#DB4C77]" label={`${summary.entendiendo} entendiendo`} />
              <Legend color="bg-muted-foreground/40" label={`${summary.no_iniciado} sin empezar`} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

const SEGMENT_COLOR = {
  consolidado: "bg-primary",
  practicando: "bg-gold",
  entendiendo: "bg-[#DB4C77]",
  no_iniciado: "bg-muted-foreground/40",
};

function StatBox({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card p-4 text-center">
      <Icon className="h-4 w-4 text-primary" />
      <p className="tabular-stat text-base font-semibold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
