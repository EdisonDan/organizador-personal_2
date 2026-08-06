"use client";

import { GraduationCap, BookOpen, Flame, Coffee } from "lucide-react";
import { formatTimeLabel, timeToMinutes, GRID_START_MIN, SLOT_MIN } from "@/lib/schedule/time";
import type { BlockType, ScheduleBlock } from "@/lib/types";

export const SLOT_HEIGHT = 26; // px por bloque de 30 min

const TYPE_META: Record<BlockType, { label: string; icon: typeof BookOpen }> = {
  class: { label: "Clase", icon: GraduationCap },
  study: { label: "Estudio", icon: BookOpen },
  habit: { label: "Hábito", icon: Flame },
  break: { label: "Descanso", icon: Coffee },
};

export function ScheduleBlockChip({
  block,
  onClick,
  onDragStart,
}: {
  block: ScheduleBlock;
  onClick: () => void;
  onDragStart: (id: string) => void;
}) {
  const startMin = timeToMinutes(block.start_time);
  const endMin = timeToMinutes(block.end_time);
  const top = ((startMin - GRID_START_MIN) / SLOT_MIN) * SLOT_HEIGHT;
  const height = Math.max(((endMin - startMin) / SLOT_MIN) * SLOT_HEIGHT - 2, 20);
  const color = block.color || "#0E7A72";
  const Icon = TYPE_META[block.block_type].icon;
  const roomy = height > 34;

  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", block.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(block.id);
      }}
      onClick={onClick}
      className="absolute left-0.5 right-0.5 z-10 overflow-hidden rounded-lg px-1.5 py-1 text-left shadow-[0_1px_2px_rgba(0,0,0,0.08)] ring-1 ring-inset ring-black/5 transition-all hover:z-20 hover:-translate-y-px hover:shadow-md active:cursor-grabbing"
      style={{
        top,
        height,
        background: `linear-gradient(135deg, ${color}2E, ${color}18)`,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div className="flex items-center gap-1">
        <Icon className="h-2.5 w-2.5 shrink-0" style={{ color }} />
        <p className="truncate text-[11px] font-medium leading-tight text-foreground">{block.title}</p>
      </div>
      {roomy && (
        <p className="tabular-stat truncate text-[10px] leading-tight text-muted-foreground">
          {formatTimeLabel(startMin)}–{formatTimeLabel(endMin)} · {TYPE_META[block.block_type].label}
        </p>
      )}
    </button>
  );
}
