// Escala de color continua (no solo 3-5 colores planos) para representar
// % de cumplimiento: 0% = rojo, 100% = verde intenso. Se usa en el heatmap
// del calendario, el anillo de progreso por hábito y el resumen semanal.

interface Stop {
  pct: number;
  rgb: [number, number, number];
}

// 6 paradas (cumple el mínimo de 5-7 tonos pedido) interpoladas en RGB.
const LIGHT_STOPS: Stop[] = [
  { pct: 0, rgb: [220, 76, 63] }, // rojo
  { pct: 20, rgb: [229, 138, 60] }, // naranja
  { pct: 40, rgb: [232, 185, 35] }, // ámbar/amarillo
  { pct: 60, rgb: [168, 201, 63] }, // verde-amarillo
  { pct: 80, rgb: [95, 174, 77] }, // verde
  { pct: 100, rgb: [31, 122, 63] }, // verde intenso
];

// Mismos matices, algo más luminosos para que se lean bien sobre fondo oscuro.
const DARK_STOPS: Stop[] = [
  { pct: 0, rgb: [224, 101, 89] },
  { pct: 20, rgb: [230, 151, 87] },
  { pct: 40, rgb: [224, 184, 76] },
  { pct: 60, rgb: [168, 201, 63] },
  { pct: 80, rgb: [110, 184, 92] },
  { pct: 100, rgb: [59, 148, 92] },
];

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

/** Interpola un color hex para un porcentaje de cumplimiento 0-100. */
export function getPerformanceColor(pct: number, dark = false): string {
  const stops = dark ? DARK_STOPS : LIGHT_STOPS;
  const clamped = Math.max(0, Math.min(100, pct));

  let lower = stops[0];
  let upper = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped >= stops[i].pct && clamped <= stops[i + 1].pct) {
      lower = stops[i];
      upper = stops[i + 1];
      break;
    }
  }

  const range = upper.pct - lower.pct;
  const t = range === 0 ? 0 : (clamped - lower.pct) / range;
  const r = lerp(lower.rgb[0], upper.rgb[0], t);
  const g = lerp(lower.rgb[1], upper.rgb[1], t);
  const b = lerp(lower.rgb[2], upper.rgb[2], t);

  return `rgb(${r}, ${g}, ${b})`;
}
