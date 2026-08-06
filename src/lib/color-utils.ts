/** Convierte "#RRGGBB" a luminancia relativa (fórmula WCAG simplificada). */
function relativeLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const [rl, gl, bl] = [r, g, b].map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/** Blanco o casi-negro, el que tenga mejor contraste sobre ese color de fondo. */
export function contrastingForeground(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return "#ffffff";
  return relativeLuminance(hex) > 0.45 ? "#171310" : "#ffffff";
}
