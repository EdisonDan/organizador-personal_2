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
  href: string;
  label: string;
  icon: LucideIcon;
}

// Contenido principal del panel. En escritorio se ven todos en el sidebar;
// en móvil, la barra inferior solo puede con BOTTOM_NAV_VISIBLE_COUNT y el
// resto vive detrás del botón "Más" (ver bottom-nav.tsx).
export const primaryNavItems: NavItem[] = [
  { href: "/today", label: "Hoy", icon: Home },
  { href: "/habits", label: "Hábitos", icon: Flame },
  { href: "/schedule", label: "Horario", icon: CalendarDays },
  { href: "/notes", label: "Notas", icon: NotebookPen },
  { href: "/subjects", label: "Materias", icon: GraduationCap },
  { href: "/goals", label: "Objetivos", icon: Target },
  { href: "/promises", label: "Promesas", icon: HeartHandshake },
];

export const BOTTOM_NAV_VISIBLE_COUNT = 4;

export const utilityNavItems: NavItem[] = [
  { href: "/achievements", label: "Logros", icon: Trophy },
  { href: "/profile", label: "Perfil", icon: User },
  { href: "/settings", label: "Configuración", icon: Settings },
];
