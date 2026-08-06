"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const HABIT_COLORS = [
  "#0E7A72", // teal (acento de la app)
  "#2563EB", // azul
  "#7C3AED", // violeta
  "#C026D3", // magenta
  "#DC4C3F", // rojo
  "#E58A3C", // naranja
  "#C99A2E", // dorado
  "#65A30D", // verde lima
  "#0891B2", // cian
  "#57534E", // gris cálido
];

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {HABIT_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={color}
            onClick={() => onChange(color)}
            className="flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-inset ring-black/10"
            style={{ backgroundColor: color }}
          >
            {value.toLowerCase() === color.toLowerCase() && (
              <Check className="h-4 w-4 text-white drop-shadow" />
            )}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        Color personalizado
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#0E7A72"}
          onChange={(e) => onChange(e.target.value)}
          className={cn("h-7 w-10 cursor-pointer rounded border border-border bg-transparent")}
        />
      </label>
    </div>
  );
}
