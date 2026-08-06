import Link from "next/link";
import Image from "next/image";
import { HabitIcon } from "@/components/habits/icon-picker";

export function SubjectCard({
  id,
  name,
  color,
  icon,
  coverUrl,
  pct,
  topicsDone,
  topicsTotal,
}: {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  coverUrl: string | null;
  pct: number;
  topicsDone: number;
  topicsTotal: number;
}) {
  return (
    <Link
      href={`/subjects/${id}`}
      className="group overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40"
    >
      <div className="relative h-24 w-full" style={{ backgroundColor: coverUrl ? undefined : `${color}22` }}>
        {coverUrl ? (
          <Image src={coverUrl} alt="" fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <HabitIcon name={icon} className="h-8 w-8" style={{ color }} />
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
          </div>
          <span className="tabular-stat shrink-0 text-[11px] text-muted-foreground">{pct}%</span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {topicsDone} de {topicsTotal} temas
        </p>
      </div>
    </Link>
  );
}
