import { Clock, CheckCircle2, Layers, Flame, AlertTriangle, RotateCcw } from "lucide-react";
import { calculateGoalStats } from "@/lib/goals/stats";
import type { GoalSubtopic, GoalTask, GoalReview, PomodoroSession } from "@/lib/types";

export function GoalStatsTab({
  subtopics,
  tasks,
  reviews,
  pomodoroSessions,
}: {
  subtopics: GoalSubtopic[];
  tasks: GoalTask[];
  reviews: GoalReview[];
  pomodoroSessions: PomodoroSession[];
}) {
  const stats = calculateGoalStats(subtopics, tasks, reviews, pomodoroSessions);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <StatCard icon={Clock} label="Tiempo esta semana" value={`${stats.minutesThisWeek} min`} />
      <StatCard icon={Clock} label="Tiempo acumulado" value={`${stats.minutesTotal} min`} />
      <StatCard icon={CheckCircle2} label="Tareas completadas" value={`${stats.tasksCompleted} / ${stats.tasksTotal}`} />
      <StatCard icon={Layers} label="Subtemas consolidados" value={`${stats.subtopicsConsolidated} / ${stats.subtopicsTotal}`} />
      <StatCard icon={Flame} label="Racha de estudio" value={`${stats.studyStreak.current} días (máx. ${stats.studyStreak.longest})`} />
      <StatCard
        icon={AlertTriangle}
        label="Días sin actividad"
        value={stats.daysSinceActivity === null ? "Sin registro" : `${stats.daysSinceActivity} días`}
      />
      <StatCard icon={RotateCcw} label="Repasos hechos" value={`${stats.reviewsDone}`} />
      <StatCard icon={RotateCcw} label="Repasos pendientes" value={`${stats.reviewsPending}`} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="tabular-stat text-base font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
