export interface AccentPreset {
  id: string;
  label: string;
  hex: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: "teal", label: "Verde azulado", hex: "#0E7A72" },
  { id: "violet", label: "Violeta", hex: "#6D5EF5" },
  { id: "rose", label: "Rosa", hex: "#DB4C77" },
  { id: "amber", label: "Ámbar", hex: "#C98A2E" },
];

export const FONT_OPTIONS = [
  { id: "sans", label: "Moderna" },
  { id: "serif", label: "Clásica" },
  { id: "rounded", label: "Redondeada" },
] as const;
