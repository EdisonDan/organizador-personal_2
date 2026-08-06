"use client";

import { useEffect, useState } from "react";
import {
  SLOTS_PER_DAY,
  GRID_START_MIN,
  GRID_END_MIN,
  formatTimeLabel,
  timeFromSlotIndex,
  timeToMinutes,
} from "@/lib/schedule/time";
import { ScheduleBlockChip, SLOT_HEIGHT } from "@/components/schedule/schedule-block-chip";
import { moveScheduleBlock } from "@/app/(dashboard)/schedule/actions";
import type { WeekDay } from "@/lib/schedule/time";
import type { ScheduleBlock } from "@/lib/types";

export function WeekGrid({
  days,
  blocksByDay,
  today,
  onCreate,
  onEdit,
}: {
  days: WeekDay[];
  /** bloques ya filtrados y agrupados por dateKey de columna (ver schedule-client.tsx) */
  blocksByDay: Map<string, ScheduleBlock[]>;
  today: WeekDay["dateKey"];
  onCreate: (day: WeekDay, startSlot: number) => void;
  onEdit: (block: ScheduleBlock) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [nowMinutes, setNowMinutes] = useState<number | null>(null);
  const hourMarks = Array.from({ length: SLOTS_PER_DAY / 2 + 1 }, (_, i) => i * 2);

  // Línea de "ahora": se calcula solo en el cliente (evita desajustes de
  // hidratación) y se refresca cada minuto.
  useEffect(() => {
    function update() {
      const now = new Date();
      setNowMinutes(now.getHours() * 60 + now.getMinutes());
    }
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  const nowTop =
    nowMinutes !== null && nowMinutes >= GRID_START_MIN && nowMinutes <= GRID_END_MIN
      ? ((nowMinutes - GRID_START_MIN) / 30) * SLOT_HEIGHT
      : null;

  async function handleDrop(day: WeekDay, slot: number) {
    if (!draggingId) return;
    // Buscar el bloque para conservar su duración
    const block = [...blocksByDay.values()].flat().find((b) => b.id === draggingId);
    setDraggingId(null);
    if (!block) return;

    const durationMin = timeToMinutes(block.end_time) - timeToMinutes(block.start_time);
    const newStart = timeFromSlotIndex(slot);
    const newEnd = timeFromSlotIndex(slot + Math.round(durationMin / 30));

    await moveScheduleBlock(block.id, {
      day_of_week: block.repeats ? day.dayOfWeek : null,
      specific_date: block.repeats ? null : day.dateKey,
      start_time: newStart,
      end_time: newEnd,
    }).catch(() => {});
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[560px]"
        style={{ gridTemplateColumns: `48px repeat(${days.length}, 1fr)` }}
      >
        {/* Encabezados */}
        <div className="border-b border-border" />
        {days.map((day) => (
          <div
            key={day.dateKey}
            className={`border-b pb-2 text-center text-xs font-medium ${
              day.dateKey === today ? "border-primary/30 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            {day.dateKey === today && (
              <span className="mx-auto mb-0.5 block h-1.5 w-1.5 rounded-full bg-primary" />
            )}
            {day.label} <span className="tabular-stat">{day.date.getDate()}</span>
          </div>
        ))}

        {/* Columna de horas */}
        <div className="relative" style={{ height: (SLOTS_PER_DAY * SLOT_HEIGHT) }}>
          {hourMarks.map((slot) => (
            <span
              key={slot}
              className="tabular-stat absolute right-1.5 -translate-y-2 text-[10px] text-muted-foreground"
              style={{ top: slot * SLOT_HEIGHT }}
            >
              {formatTimeLabel(GRID_START_MIN + slot * 30)}
            </span>
          ))}
        </div>

        {/* Columnas de días */}
        {days.map((day) => {
          const blocks = blocksByDay.get(day.dateKey) ?? [];
          return (
            <div
              key={day.dateKey}
              className={`relative border-l border-border ${day.dateKey === today ? "bg-primary-soft/30" : ""}`}
              style={{
                height: SLOTS_PER_DAY * SLOT_HEIGHT,
                backgroundImage:
                  day.dateKey === today
                    ? undefined
                    : `repeating-linear-gradient(180deg, transparent, transparent ${SLOT_HEIGHT * 2 - 1}px, var(--color-muted) ${SLOT_HEIGHT * 2 - 1}px, var(--color-muted) ${SLOT_HEIGHT * 2}px)`,
              }}
            >
              {Array.from({ length: SLOTS_PER_DAY }, (_, slot) => (
                <div
                  key={slot}
                  onClick={() => onCreate(day, slot)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(day, slot);
                  }}
                  className="cursor-pointer border-b border-border/40 hover:bg-primary/5"
                  style={{ height: SLOT_HEIGHT }}
                />
              ))}

              {blocks.map((block) => (
                <ScheduleBlockChip
                  key={block.id}
                  block={block}
                  onClick={() => onEdit(block)}
                  onDragStart={setDraggingId}
                />
              ))}

              {day.dateKey === today && nowTop !== null && (
                <div
                  className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                  style={{ top: nowTop }}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                  <span className="h-px flex-1 bg-destructive" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
