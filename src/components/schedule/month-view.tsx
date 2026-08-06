"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toDateKey } from "@/lib/schedule/time";
import type { ScheduleBlock } from "@/lib/types";

const DIAS = ["D", "L", "M", "M", "J", "V", "S"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function MonthView({
  blocks,
  onSelectDay,
}: {
  blocks: ScheduleBlock[];
  onSelectDay: (date: Date) => void;
}) {
  const [offset, setOffset] = useState(0);
  const today = new Date();
  const view = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const year = view.getFullYear();
  const month = view.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();

  const cells: (Date | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => new Date(year, month, i + 1)),
  ];

  function blocksForDate(date: Date) {
    const key = toDateKey(date);
    return blocks.filter(
      (b) => (b.repeats && b.day_of_week === date.getDay()) || (!b.repeats && b.specific_date === key)
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOffset((o) => o - 1)}
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
          onClick={() => setOffset((o) => o + 1)}
          aria-label="Mes siguiente"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DIAS.map((d, i) => (
          <span key={i} className="text-[10px] font-medium text-muted-foreground">
            {d}
          </span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={i} />;
          const dayBlocks = blocksForDate(date);
          const isToday = toDateKey(date) === toDateKey(today);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDay(date)}
              className={`flex min-h-16 flex-col items-start gap-0.5 rounded-lg border p-1 text-left ${
                isToday ? "border-primary" : "border-transparent hover:bg-muted"
              }`}
            >
              <span className={`tabular-stat text-[10px] ${isToday ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                {date.getDate()}
              </span>
              <div className="flex w-full flex-col gap-0.5">
                {dayBlocks.slice(0, 2).map((b) => (
                  <span
                    key={b.id}
                    className="truncate rounded px-1 py-0.5 text-[9px] text-white"
                    style={{ backgroundColor: b.color || "#0E7A72" }}
                  >
                    {b.title}
                  </span>
                ))}
                {dayBlocks.length > 2 && (
                  <span className="text-[9px] text-muted-foreground">+{dayBlocks.length - 2} más</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
