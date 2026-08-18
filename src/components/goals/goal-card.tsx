import Link from "next/link";
import { HabitIcon } from "@/components/habits/icon-picker";
import { ProgressRing } from "@/components/habits/progress-ring";

export function GoalCard({
  id,
  title,
  category,
  color,
  icon,
  progressPct,
  minutesThisWeek,
}: {
  id: string;
  title: string;
  category: string | null;
  color: string;
  icon: string | null;
  progressPct: number;
  minutesThisWeek: number;
}) {
  return (
    <Link
      href={`/goals/${id}`}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <ProgressRing percent={progressPct} size={48} strokeWidth={4}>
        <HabitIcon name={icon} className="h-5 w-5" style={{ color }} />
      </ProgressRing>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{category || "Objetivo"}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="tabular-stat text-sm font-semibold text-foreground">{progressPct}%</p>
        {minutesThisWeek > 0 && (
          <p className="tabular-stat text-[10px] text-muted-foreground">{minutesThisWeek} min esta sem.</p>
        )}
      </div>
    </Link>
  );
}
