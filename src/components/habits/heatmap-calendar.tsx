"use client";

import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { computeDailyCompletion } from "@/lib/habits/aggregate";
import { getPerformanceColor } from "@/lib/habits/color-scale";
import { toDateKey } from "@/lib/habits/frequency";
import type { Habit, HabitLog } from "@/lib/types";

const DIAS = ["D", "L", "M", "M", "J", "V", "S"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function HeatmapCalendar({
  habits,
  logs,
  onDayClick,
}: {
  habits: Habit[];
  logs: HabitLog[];
  /** Si se pasa, cada día del mes se puede clicar (pensado para la vista de un solo hábito). */
  onDayClick?: (dateKey: string) => void;
}) {
  const [mode, setMode] = useState<"mes" | "año">("mes");
  const [monthOffset, setMonthOffset] = useState(0);
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Calendario de constancia</h2>
        <div className="flex items-center gap-1 rounded-full border border-border bg-muted p-0.5">
          {(["mes", "año"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                mode === m ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {mode === "mes" ? (
        <MonthView
          habits={habits}
          logs={logs}
          offset={monthOffset}
          onOffset={setMonthOffset}
          dark={dark}
          onDayClick={onDayClick}
        />
      ) : (
        <YearView habits={habits} logs={logs} dark={dark} />
      )}

      <Legend />
    </div>
  );
}

function MonthView({
  habits,
  logs,
  offset,
  onOffset,
  dark,
  onDayClick,
}: {
  habits: Habit[];
  logs: HabitLog[];
  offset: number;
  onOffset: (v: number) => void;
  dark: boolean;
  onDayClick?: (dateKey: string) => void;
}) {
  const today = new Date();
  const viewDate = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay(); // 0=domingo

  // firstDay/lastDay son objetos Date nuevos en cada render, pero se derivan
  // determinísticamente de year/month (que sí están en las dependencias).
  /* eslint-disable react-hooks/exhaustive-deps */
  const completion = useMemo(
    () => computeDailyCompletion(habits, logs, firstDay, lastDay),
    [habits, logs, year, month]
  );
  /* eslint-enable react-hooks/exhaustive-deps */

  const cells: (Date | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => new Date(year, month, i + 1)),
  ];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onOffset(offset - 1)}
          aria-label="Mes anterior"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-medium text-foreground">
          {MESES[month]} {year}
        </p>
        <button
          type="button"
          onClick={() => onOffset(offset + 1)}
          aria-label="Mes siguiente"
          disabled={offset >= 0}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center">
        {DIAS.map((d, i) => (
          <span key={i} className="text-[10px] font-medium text-muted-foreground">
            {d}
          </span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={i} />;
          const key = toDateKey(date);
          const entry = completion.get(key);
          const isFuture = date > today;
          const color =
            entry && entry.pct >= 0 && !isFuture ? getPerformanceColor(entry.pct, dark) : undefined;
          const clickable = Boolean(onDayClick) && !isFuture;
          return (
            <button
              key={i}
              type="button"
              disabled={!clickable}
              onClick={() => onDayClick?.(key)}
              title={entry && entry.pct >= 0 ? `${date.getDate()}: ${entry.pct}% (${entry.done}/${entry.due})` : undefined}
              className={`flex aspect-square items-center justify-center rounded-md text-[10px] font-medium transition-transform ${
                clickable ? "cursor-pointer hover:scale-110 hover:ring-2 hover:ring-primary/50" : "cursor-default"
              }`}
              style={{
                backgroundColor: color ?? "var(--color-muted)",
                color: color ? "white" : "var(--color-muted-foreground)",
              }}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function YearView({ habits, logs, dark }: { habits: Habit[]; logs: HabitLog[]; dark: boolean }) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 363);
  // Retroceder hasta el domingo para alinear columnas por semana
  start.setDate(start.getDate() - start.getDay());

  // start/today se recalculan cada render pero representan "hoy" dentro de
  // la misma sesión; no deben disparar un recálculo en cada re-render.
  /* eslint-disable react-hooks/exhaustive-deps */
  const completion = useMemo(
    () => computeDailyCompletion(habits, logs, start, today),
    [habits, logs]
  );
  /* eslint-enable react-hooks/exhaustive-deps */

  const weeks: Date[][] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex gap-[3px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((date, di) => {
              const key = toDateKey(date);
              const entry = completion.get(key);
              const isFuture = date > today;
              const color =
                entry && entry.pct >= 0 && !isFuture ? getPerformanceColor(entry.pct, dark) : undefined;
              return (
                <div
                  key={di}
                  title={`${key}${entry && entry.pct >= 0 ? `: ${entry.pct}%` : ""}`}
                  className="h-[11px] w-[11px] rounded-[2px]"
                  style={{ backgroundColor: color ?? "var(--color-muted)" }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
      Menos
      {[0, 20, 40, 60, 80, 100].map((p) => (
        <span
          key={p}
          className="h-2.5 w-2.5 rounded-sm"
          style={{ backgroundColor: getPerformanceColor(p) }}
        />
      ))}
      Más
    </div>
  );
}
