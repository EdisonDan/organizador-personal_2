"use client";

import { useState, useTransition } from "react";
import { Check, Ban, Pencil } from "lucide-react";
import { HabitIcon } from "@/components/habits/icon-picker";
import { toggleHabitLog } from "@/app/(dashboard)/habits/actions";
import { cn } from "@/lib/utils";
import type { Habit, HabitLog } from "@/lib/types";

export function DailyChecklistItem({
  habit,
  log,
  dateKey,
  due,
  onOpenDetail,
}: {
  habit: Habit;
  log?: HabitLog;
  dateKey: string;
  due: boolean;
  onOpenDetail: () => void;
}) {
  const isNegative = habit.type === "negative";
  const [completed, setCompleted] = useState(log?.completed ?? false);
  const [popping, setPopping] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !completed;
    setCompleted(next);
    if (next) {
      setPopping(true);
      setTimeout(() => setPopping(false), 300);
    }
    startTransition(() => {
      toggleHabitLog(habit.id, dateKey, next, habit.goal_value ?? null).catch(() => {
        setCompleted(!next); // revertir si falla
      });
    });
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 transition-opacity",
        !due && "opacity-50"
      )}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${habit.color}22`, color: habit.color }}
      >
        {habit.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={habit.image_url} alt="" className="h-full w-full rounded-lg object-cover" />
        ) : (
          <HabitIcon name={habit.icon} className="h-4 w-4" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{habit.name}</p>
        <p className="text-xs text-muted-foreground">
          {!due ? "No te toca hoy" : isNegative ? "Hábito a evitar" : habit.category || "Hábito"}
        </p>
      </div>

      {due && (
        <button
          type="button"
          onClick={onOpenDetail}
          aria-label="Agregar nota o foto"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}

      <button
        type="button"
        disabled={!due || isPending}
        onClick={handleToggle}
        aria-pressed={completed}
        aria-label={isNegative ? "Marcar evitado hoy" : "Marcar hecho hoy"}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors disabled:cursor-not-allowed",
          popping && "animate-habit-pop",
          completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-transparent hover:border-primary/50"
        )}
      >
        {isNegative ? <Ban className="h-4 w-4" /> : <Check className="h-4 w-4" />}
      </button>
    </div>
  );
}
