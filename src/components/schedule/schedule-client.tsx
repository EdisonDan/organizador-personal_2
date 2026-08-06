"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { WeekGrid } from "@/components/schedule/week-grid";
import { MonthView } from "@/components/schedule/month-view";
import { BlockFormDialog } from "@/components/schedule/block-form-dialog";
import { PomodoroTimer } from "@/components/schedule/pomodoro-timer";
import { DeadlineList } from "@/components/schedule/deadline-list";
import { getWeekDays, timeFromSlotIndex, toDateKey } from "@/lib/schedule/time";
import type { WeekDay } from "@/lib/schedule/time";
import type { ScheduleBlock, Subject, Habit, Deadline } from "@/lib/types";

type ViewMode = "día" | "semana" | "mes";

export function ScheduleClient({
  blocks,
  subjects,
  habits,
  deadlines,
  todayPomodoroCount,
  pomodoroBySubject,
  weekStartsOn,
}: {
  blocks: ScheduleBlock[];
  subjects: Subject[];
  habits: Habit[];
  deadlines: Deadline[];
  todayPomodoroCount: number;
  pomodoroBySubject: { subjectId: string | null; subjectName: string; count: number }[];
  weekStartsOn: number;
}) {
  const [view, setView] = useState<ViewMode>("semana");
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [formState, setFormState] = useState<
    | { mode: "create"; day: WeekDay; startSlot: number }
    | { mode: "edit"; block: ScheduleBlock }
    | null
  >(null);

  const today = toDateKey(new Date());

  const days: WeekDay[] = useMemo(() => {
    const week = getWeekDays(referenceDate, weekStartsOn);
    if (view === "día") {
      const key = toDateKey(referenceDate);
      return week.filter((d) => d.dateKey === key);
    }
    return week;
  }, [referenceDate, view, weekStartsOn]);

  const blocksByDay = useMemo(() => {
    const map = new Map<string, ScheduleBlock[]>();
    for (const day of days) {
      const dayBlocks = blocks
        .filter(
          (b) =>
            (b.repeats && b.day_of_week === day.dayOfWeek) ||
            (!b.repeats && b.specific_date === day.dateKey)
        )
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
      map.set(day.dateKey, dayBlocks);
    }
    return map;
  }, [blocks, days]);

  function shift(deltaDays: number) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() + deltaDays);
    setReferenceDate(d);
  }

  const rangeLabel = useMemo(() => {
    if (view === "día") {
      return referenceDate.toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" });
    }
    if (view === "semana" && days.length > 0) {
      const first = days[0].date;
      const last = days[days.length - 1].date;
      return `${first.getDate()} – ${last.getDate()} de ${last.toLocaleDateString("es-EC", { month: "long" })}`;
    }
    return "";
  }, [view, referenceDate, days]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 rounded-full border border-border bg-muted p-0.5">
              {(["día", "semana", "mes"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    view === v ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            {view !== "mes" && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => shift(view === "día" ? -1 : -7)}
                  aria-label="Anterior"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-32 text-center text-xs font-medium capitalize text-foreground">
                  {rangeLabel}
                </span>
                <button
                  type="button"
                  onClick={() => shift(view === "día" ? 1 : 7)}
                  aria-label="Siguiente"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                setFormState({
                  mode: "create",
                  day: days[0] ?? getWeekDays(new Date())[0],
                  startSlot: 4, // 08:00 por defecto
                })
              }
              className="btn-primary"
            >
              <Plus className="h-4 w-4" />
              Bloque
            </button>
          </div>

          {view === "mes" ? (
            <MonthView
              blocks={blocks}
              onSelectDay={(date) => {
                setReferenceDate(date);
                setView("día");
              }}
            />
          ) : (
            <div className="rounded-2xl border border-border bg-card p-4">
              <WeekGrid
                days={days}
                blocksByDay={blocksByDay}
                today={today}
                onCreate={(day, startSlot) => setFormState({ mode: "create", day, startSlot })}
                onEdit={(block) => setFormState({ mode: "edit", block })}
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <PomodoroTimer
            subjects={subjects}
            initialTodayCount={todayPomodoroCount}
            initialBySubject={pomodoroBySubject}
          />
          <DeadlineList deadlines={deadlines} subjects={subjects} />
        </div>
      </div>

      {formState && (
        <BlockFormDialog
          open
          onClose={() => setFormState(null)}
          subjects={subjects}
          habits={habits}
          block={formState.mode === "edit" ? formState.block : undefined}
          defaultDay={
            formState.mode === "create"
              ? { dayOfWeek: formState.day.dayOfWeek, dateKey: formState.day.dateKey }
              : undefined
          }
          defaultStart={formState.mode === "create" ? timeFromSlotIndex(formState.startSlot) : undefined}
          defaultEnd={formState.mode === "create" ? timeFromSlotIndex(formState.startSlot + 2) : undefined}
        />
      )}
    </div>
  );
}
