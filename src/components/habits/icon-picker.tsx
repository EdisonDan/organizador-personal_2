"use client";

import {
  BookOpen,
  Dumbbell,
  Droplet,
  Moon,
  Sun,
  Footprints,
  Brain,
  Coffee,
  Music,
  Pencil,
  Heart,
  Code,
  Salad,
  Bike,
  Guitar,
  PiggyBank,
  Cigarette,
  Smartphone,
  Bed,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const HABIT_ICONS: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  dumbbell: Dumbbell,
  droplet: Droplet,
  moon: Moon,
  sun: Sun,
  footprints: Footprints,
  brain: Brain,
  coffee: Coffee,
  music: Music,
  pencil: Pencil,
  heart: Heart,
  code: Code,
  salad: Salad,
  bike: Bike,
  guitar: Guitar,
  "piggy-bank": PiggyBank,
  cigarette: Cigarette,
  smartphone: Smartphone,
  bed: Bed,
  sparkles: Sparkles,
};

export function HabitIcon({
  name,
  className,
  style,
}: {
  name: string | null;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Icon = (name && HABIT_ICONS[name]) || Sparkles;
  return <Icon className={className} style={style} />;
}

export function IconPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (icon: string) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
      {Object.entries(HABIT_ICONS).map(([key, Icon]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          aria-label={key}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
            value === key
              ? "border-primary bg-primary-soft text-primary"
              : "border-border text-muted-foreground hover:bg-muted"
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
