import {
  Home,
  Flame,
  CalendarDays,
  NotebookPen,
  GraduationCap,
  Target,
  HeartHandshake,
  Trophy,
  User,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
}

// Secciones que el usuario puede ocultar y reordenar desde
// Configuración > Personalizar panel. El id coincide con lo que se guarda
// en profiles.visible_sections / profiles.section_order.
export const HIDEABLE_SECTIONS: NavItem[] = [
  { id: "today", href: "/today", label: "Hoy", icon: Home },
  { id: "habits", href: "/habits", label: "Hábitos", icon: Flame },
  { id: "schedule", href: "/schedule", label: "Horario", icon: CalendarDays },
  { id: "notes", href: "/notes", label: "Notas", icon: NotebookPen },
  { id: "subjects", href: "/subjects", label: "Materias", icon: GraduationCap },
  { id: "goals", href: "/goals", label: "Objetivos", icon: Target },
  { id: "promises", href: "/promises", label: "Promesas", icon: HeartHandshake },
  { id: "achievements", href: "/achievements", label: "Logros", icon: Trophy },
];

export const DEFAULT_SECTION_ORDER = HIDEABLE_SECTIONS.map((s) => s.id);

// Siempre visibles, no se pueden ocultar ni reordenar.
export const ALWAYS_VISIBLE_ITEMS: NavItem[] = [
  { id: "profile", href: "/profile", label: "Perfil", icon: User },
  { id: "settings", href: "/settings", label: "Configuración", icon: Settings },
];

export const BOTTOM_NAV_VISIBLE_COUNT = 4;

/** Filtra y ordena las secciones ocultables según la preferencia guardada del usuario. */
export function getVisibleSections(visibleIds: string[], order: string[]): NavItem[] {
  const byId = new Map(HIDEABLE_SECTIONS.map((s) => [s.id, s]));
  const visibleSet = new Set(visibleIds.length > 0 ? visibleIds : DEFAULT_SECTION_ORDER);

  const orderedIds = order.length > 0 ? order : DEFAULT_SECTION_ORDER;
  const seen = new Set<string>();
  const result: NavItem[] = [];

  for (const id of orderedIds) {
    if (seen.has(id) || !visibleSet.has(id)) continue;
    const item = byId.get(id);
    if (item) {
      result.push(item);
      seen.add(id);
    }
  }
  // Cualquier sección visible que no estuviera en el orden guardado (ej. una
  // sección nueva que se agregó a la app) se muestra al final.
  for (const id of DEFAULT_SECTION_ORDER) {
    if (!seen.has(id) && visibleSet.has(id)) {
      const item = byId.get(id);
      if (item) result.push(item);
    }
  }

  return result;
}
