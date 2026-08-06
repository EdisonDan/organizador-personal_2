"use client";

import { useMemo } from "react";
import { useTheme } from "next-themes";
import { computeDailyCompletion } from "@/lib/habits/aggregate";
import { getPerformanceColor } from "@/lib/habits/color-scale";
import type { Habit, HabitLog } from "@/lib/types";

const WEEKS_SHOWN = 8;

export function WeeklySummary({ habits, logs }: { habits: Habit[]; logs: HabitLog[] }) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (WEEKS_SHOWN * 7 - 1));

  // start/today representan "hoy" dentro de la sesión actual; no deben
  // forzar un recálculo en cada re-render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const completion = useMemo(() => computeDailyCompletion(habits, logs, start, today), [habits, logs]);

  const weeks = useMemo(() => {
    const out: { label: string; pct: number | null }[] = [];
    const cursor = new Date(start);
    for (let w = 0; w < WEEKS_SHOWN; w++) {
      let due = 0;
      let done = 0;
      const weekStart = new Date(cursor);
      for (let i = 0; i < 7; i++) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
        const entry = completion.get(key);
        if (entry && entry.pct >= 0) {
          due += entry.due;
          done += entry.done;
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      out.push({
        label: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
        pct: due === 0 ? null : Math.round((done / due) * 100),
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completion]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 text-sm font-semibold text-foreground">Resumen semanal</h2>
      <div className="flex items-end gap-2">
        {weeks.map((week, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className="h-14 w-full rounded-lg"
              style={{
                backgroundColor:
                  week.pct === null ? "var(--color-muted)" : getPerformanceColor(week.pct, dark),
              }}
              title={week.pct === null ? "Sin datos" : `${week.pct}%`}
            />
            <span className="text-[10px] text-muted-foreground">{week.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
