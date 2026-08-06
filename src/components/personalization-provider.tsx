"use client";

import { useEffect } from "react";
import { ACCENT_PRESETS } from "@/lib/theme-presets";
import { contrastingForeground } from "@/lib/color-utils";
import type { FontPref } from "@/lib/types";

export function resolveAccentHex(accentColor: string): string {
  const preset = ACCENT_PRESETS.find((p) => p.id === accentColor);
  if (preset) return preset.hex;
  if (/^#[0-9a-fA-F]{6}$/.test(accentColor)) return accentColor;
  return ACCENT_PRESETS[0].hex;
}

const FONT_VAR: Record<FontPref, string> = {
  sans: "var(--font-jakarta)",
  serif: "var(--font-source-serif)",
  rounded: "var(--font-quicksand)",
};

export function PersonalizationProvider({
  accentColor,
  fontPref,
  backgroundColor,
  children,
}: {
  accentColor: string;
  fontPref: FontPref;
  backgroundColor?: string | null;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const hex = resolveAccentHex(accentColor);
    const foreground = contrastingForeground(hex);
    const root = document.documentElement.style;
    root.setProperty("--primary", hex);
    root.setProperty("--primary-foreground", foreground);
    root.setProperty("--primary-soft", `color-mix(in srgb, ${hex} ${document.documentElement.classList.contains("dark") ? 28 : 14}%, ${document.documentElement.classList.contains("dark") ? "black" : "white"})`);
    root.setProperty("--ring", hex);
  }, [accentColor]);

  useEffect(() => {
    document.documentElement.style.setProperty("--font-active", FONT_VAR[fontPref] ?? FONT_VAR.sans);
  }, [fontPref]);

  useEffect(() => {
    const root = document.documentElement.style;
    if (backgroundColor && /^#[0-9a-fA-F]{6}$/.test(backgroundColor)) {
      root.setProperty("--background", backgroundColor);
      root.setProperty("--foreground", contrastingForeground(backgroundColor));
      // Las tarjetas se derivan del mismo color de fondo para que combinen,
      // sin importar si es un gris claro, uno oscuro, o cualquier tono.
      root.setProperty("--card", `color-mix(in srgb, ${backgroundColor} 92%, ${contrastingForeground(backgroundColor)})`);
      root.setProperty("--muted", `color-mix(in srgb, ${backgroundColor} 85%, ${contrastingForeground(backgroundColor)})`);
    } else {
      root.removeProperty("--background");
      root.removeProperty("--foreground");
      root.removeProperty("--card");
      root.removeProperty("--muted");
    }
  }, [backgroundColor]);

  return <>{children}</>;
}
