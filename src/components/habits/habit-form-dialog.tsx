"use client";

import { useRef, useState } from "react";
import { Plus, Ban, Loader2, ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { Dialog } from "@/components/ui/dialog";
import { IconPicker, HabitIcon } from "@/components/habits/icon-picker";
import { ColorPicker } from "@/components/habits/color-picker";
import { uploadHabitImage } from "@/lib/habits/upload-image";
import { createHabit, updateHabit, type HabitFormInput } from "@/app/(dashboard)/habits/actions";
import type { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["D", "L", "M", "M", "J", "V", "S"]; // 0=domingo..6=sábado

export function HabitFormDialog({
  open,
  onClose,
  userId,
  habit,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  habit?: Habit;
}) {
  const isEdit = Boolean(habit);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(habit?.name ?? "");
  const [type, setType] = useState<"positive" | "negative">(habit?.type ?? "positive");
  const [icon, setIcon] = useState<string | null>(habit?.icon ?? "sparkles");
  const [imageUrl, setImageUrl] = useState<string | null>(habit?.image_url ?? null);
  const [color, setColor] = useState(habit?.color ?? "#0E7A72");
  const [category, setCategory] = useState(habit?.category ?? "");
  const [frequencyType, setFrequencyType] = useState(habit?.frequency_type ?? "daily");
  const [days, setDays] = useState<number[]>(
    (habit?.frequency_config?.days as number[] | undefined) ?? [1, 2, 3, 4, 5]
  );
  const [daysPerWeek, setDaysPerWeek] = useState(
    (habit?.frequency_config?.days_per_week as number | undefined) ?? 3
  );
  const [goalValue, setGoalValue] = useState(habit?.goal_value?.toString() ?? "");
  const [goalUnit, setGoalUnit] = useState(habit?.goal_unit ?? "");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadHabitImage(userId, file, "habits");
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
    }
  }

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Ponle un nombre al hábito.");
      return;
    }
    setSaving(true);
    setError(null);

    const frequency_config =
      frequencyType === "specific_days"
        ? { days }
        : frequencyType === "weekly_count"
          ? { days_per_week: daysPerWeek }
          : {};

    const input: HabitFormInput = {
      name: name.trim(),
      type,
      icon: imageUrl ? null : icon,
      image_url: imageUrl,
      color,
      category: category.trim() || null,
      frequency_type: frequencyType,
      frequency_config,
      goal_value: goalValue ? Number(goalValue) : null,
      goal_unit: goalValue ? goalUnit.trim() || null : null,
    };

    try {
      if (isEdit && habit) {
        await updateHabit(habit.id, input);
      } else {
        await createHabit(input);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el hábito.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? "Editar hábito" : "Nuevo hábito"}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tipo: positivo vs negativo -- es la primera decisión, no un detalle escondido */}
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-foreground">¿Qué tipo de hábito es?</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("positive")}
              className={cn(
                "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors",
                type === "positive"
                  ? "border-primary bg-primary-soft"
                  : "border-border hover:bg-muted"
              )}
            >
              <Plus className={cn("h-4 w-4", type === "positive" ? "text-primary" : "text-muted-foreground")} />
              <span className="text-sm font-medium text-foreground">Quiero hacerlo</span>
              <span className="text-xs text-muted-foreground">Positivo: leer, ejercicio, estudiar...</span>
            </button>
            <button
              type="button"
              onClick={() => setType("negative")}
              className={cn(
                "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors",
                type === "negative"
                  ? "border-destructive bg-destructive/10"
                  : "border-border hover:bg-muted"
              )}
            >
              <Ban className={cn("h-4 w-4", type === "negative" ? "text-destructive" : "text-muted-foreground")} />
              <span className="text-sm font-medium text-foreground">Quiero evitarlo</span>
              <span className="text-xs text-muted-foreground">Negativo: fumar, procrastinar...</span>
            </button>
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">
            {type === "negative" ? "¿Qué quieres evitar?" : "Nombre"}
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder={type === "negative" ? "Ej. Fumar, redes sociales antes de dormir" : "Ej. Leer, correr 5km"}
          />
        </label>

        {/* Ícono / imagen */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground">Ícono o imagen propia</span>
          <div className="flex items-start gap-3">
            <div className="flex flex-1 flex-col gap-2">
              <IconPicker
                value={imageUrl ? null : icon}
                onChange={(v) => {
                  setIcon(v);
                  setImageUrl(null);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex w-fit items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                Subir imagen propia
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImagePick}
              />
            </div>
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border"
              style={{ backgroundColor: imageUrl ? undefined : `${color}22` }}
            >
              {imageUrl ? (
                <div className="relative h-full w-full">
                  <Image src={imageUrl} alt="" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                    aria-label="Quitar imagen"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </div>
              ) : (
                <HabitIcon name={icon} className="h-6 w-6" style={{ color }} />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-sm font-medium text-foreground">Color</span>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Categoría (opcional)</span>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
            placeholder="Ej. Salud, Estudio, Bienestar"
          />
        </label>

        {/* Frecuencia */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground">Frecuencia</span>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["daily", "Todos los días"],
                ["specific_days", "Días específicos"],
                ["weekly_count", "X veces por semana"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFrequencyType(value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  frequencyType === value
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {frequencyType === "specific_days" && (
            <div className="flex gap-1.5">
              {WEEKDAYS.map((label, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                    days.includes(i)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {frequencyType === "weekly_count" && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="number"
                min={1}
                max={7}
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                className="input w-16 text-center"
              />
              veces por semana
            </label>
          )}
        </div>

        {/* Meta cuantificable */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Meta (opcional)</span>
            <input
              type="number"
              value={goalValue}
              onChange={(e) => setGoalValue(e.target.value)}
              className="input"
              placeholder="10"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Unidad</span>
            <input
              value={goalUnit}
              onChange={(e) => setGoalUnit(e.target.value)}
              className="input"
              placeholder="páginas, km..."
              disabled={!goalValue}
            />
          </label>
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Guardar cambios" : "Crear hábito"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
