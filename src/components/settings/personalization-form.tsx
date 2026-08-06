"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Check, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { ACCENT_PRESETS, FONT_OPTIONS } from "@/lib/theme-presets";
import { uploadFile } from "@/lib/storage";
import { updatePreferences } from "@/app/(dashboard)/settings/actions";
import type { FontPref, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

const FONT_PREVIEW_CLASS: Record<FontPref, string> = {
  sans: "font-sans",
  serif: "font-serif",
  rounded: "font-rounded",
};

export function PersonalizationForm({ userId, profile }: { userId: string; profile: Profile }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [accentColor, setAccentColor] = useState(profile.accent_color);
  const [fontPref, setFontPref] = useState<FontPref>(profile.font_pref);
  const [backgroundUrl, setBackgroundUrl] = useState(profile.background_image_url);
  const [backgroundColor, setBackgroundColor] = useState(profile.background_color);
  const [weekStart, setWeekStart] = useState(profile.week_start_day);
  const [dateFormat, setDateFormat] = useState(profile.date_format);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  function flashSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function handleAccent(id: string) {
    setAccentColor(id);
    await updatePreferences({ accent_color: id }).catch(() => {});
    flashSaved();
  }

  async function handleFont(id: FontPref) {
    setFontPref(id);
    await updatePreferences({ font_pref: id }).catch(() => {});
    flashSaved();
  }

  const BACKGROUND_PRESETS = [
    { label: "Predeterminado", value: null },
    { label: "Gris claro", value: "#E8E8E6" },
    { label: "Gris oscuro", value: "#26282B" },
    { label: "Negro suave", value: "#15171A" },
    { label: "Azul noche", value: "#111827" },
  ];

  async function handleBackgroundColor(color: string | null) {
    setBackgroundColor(color);
    await updatePreferences({ background_color: color }).catch(() => {});
    flashSaved();
  }

  async function handleWeekStart(day: number) {
    setWeekStart(day);
    await updatePreferences({ week_start_day: day }).catch(() => {});
    flashSaved();
  }

  async function handleDateFormat(format: string) {
    setDateFormat(format);
    await updatePreferences({ date_format: format }).catch(() => {});
    flashSaved();
  }

  async function handleBackgroundPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadFile(userId, file, "background");
      setBackgroundUrl(uploaded.url);
      await updatePreferences({ background_image_url: uploaded.url });
      flashSaved();
    } catch {
      // el usuario puede intentar de nuevo; no bloquea el resto de la página
    } finally {
      setUploading(false);
    }
  }

  async function removeBackground() {
    setBackgroundUrl(null);
    await updatePreferences({ background_image_url: null }).catch(() => {});
    flashSaved();
  }

  return (
    <div className="space-y-5">
      {/* Color de acento */}
      <section className="max-w-lg rounded-2xl border border-border bg-card p-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Color de acento</p>
          {saved && <SavedBadge />}
        </div>
        <div className="flex flex-wrap gap-2">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleAccent(preset.id)}
              aria-label={preset.label}
              title={preset.label}
              className="flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-inset ring-black/10"
              style={{ backgroundColor: preset.hex }}
            >
              {accentColor === preset.id && <Check className="h-4 w-4 text-white drop-shadow" />}
            </button>
          ))}
          <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-border text-muted-foreground">
            <input
              type="color"
              className="sr-only"
              value={/^#[0-9a-fA-F]{6}$/.test(accentColor) ? accentColor : "#0E7A72"}
              onChange={(e) => handleAccent(e.target.value)}
            />
            <span className="text-xs">+</span>
          </label>
        </div>
      </section>

      {/* Tipografía */}
      <section className="max-w-lg rounded-2xl border border-border bg-card p-6">
        <p className="mb-3 text-sm font-medium text-foreground">Tipografía</p>
        <div className="grid grid-cols-3 gap-2">
          {FONT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleFont(opt.id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border p-3 transition-colors",
                fontPref === opt.id ? "border-primary bg-primary-soft" : "border-border hover:bg-muted"
              )}
            >
              <span className={cn("text-lg text-foreground", FONT_PREVIEW_CLASS[opt.id])}>Aa</span>
              <span className="text-[11px] text-muted-foreground">{opt.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Color de fondo */}
      <section className="max-w-lg rounded-2xl border border-border bg-card p-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Color de fondo</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {BACKGROUND_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleBackgroundColor(preset.value)}
              title={preset.label}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-inset ring-black/10",
                preset.value === null && "bg-[repeating-linear-gradient(45deg,#ccc,#ccc_3px,#fff_3px,#fff_6px)]"
              )}
              style={preset.value ? { backgroundColor: preset.value } : undefined}
            >
              {backgroundColor === preset.value && (
                <Check className={cn("h-4 w-4 drop-shadow", preset.value ? "text-white" : "text-black")} />
              )}
            </button>
          ))}
          <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-border text-muted-foreground">
            <input
              type="color"
              className="sr-only"
              value={backgroundColor && /^#[0-9a-fA-F]{6}$/.test(backgroundColor) ? backgroundColor : "#808080"}
              onChange={(e) => handleBackgroundColor(e.target.value)}
            />
            <span className="text-xs">+</span>
          </label>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Reemplaza el fondo claro/oscuro normal por el color que elijas (las tarjetas se ajustan solas para que
          combinen y el texto se siga leyendo bien).
        </p>
      </section>

      {/* Imagen de fondo */}
      <section className="max-w-lg rounded-2xl border border-border bg-card p-6">
        <p className="mb-3 text-sm font-medium text-foreground">Imagen de fondo del dashboard</p>
        {backgroundUrl ? (
          <div className="relative h-28 w-full overflow-hidden rounded-xl border border-border">
            <Image src={backgroundUrl} alt="" fill className="object-cover" />
            <button
              type="button"
              onClick={removeBackground}
              className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white"
            >
              <Trash2 className="h-3 w-3" />
              Quitar
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-secondary w-full">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            Subir imagen de fondo
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBackgroundPick} />
        <p className="mt-2 text-xs text-muted-foreground">
          Se muestra detrás del contenido con una capa encima para que el texto siga siendo legible.
        </p>
      </section>

      {/* Día de inicio de semana */}
      <section className="max-w-lg rounded-2xl border border-border bg-card p-6">
        <p className="mb-3 text-sm font-medium text-foreground">Día de inicio de semana</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleWeekStart(1)}
            className={cn("rounded-lg border px-4 py-2 text-sm", weekStart === 1 ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground")}
          >
            Lunes
          </button>
          <button
            type="button"
            onClick={() => handleWeekStart(0)}
            className={cn("rounded-lg border px-4 py-2 text-sm", weekStart === 0 ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground")}
          >
            Domingo
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Afecta la grilla semanal de Horario.</p>
      </section>

      {/* Formato de fecha */}
      <section className="max-w-lg rounded-2xl border border-border bg-card p-6">
        <p className="mb-3 text-sm font-medium text-foreground">Formato de fecha</p>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "dd/mm/yyyy", label: "31/12/2026" },
            { value: "mm/dd/yyyy", label: "12/31/2026" },
            { value: "yyyy-mm-dd", label: "2026-12-31" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleDateFormat(opt.value)}
              className={cn(
                "tabular-stat rounded-lg border px-3 py-2 text-sm",
                dateFormat === opt.value ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Se guarda como tu preferencia. La mayoría de fechas en la app ya se muestran en español sin ambigüedad
          (ej. &quot;sábado 1 de agosto&quot;); este formato se usa donde se necesita una fecha corta y numérica.
        </p>
      </section>
    </div>
  );
}

function SavedBadge() {
  return <span className="text-xs font-medium text-primary">Guardado</span>;
}
