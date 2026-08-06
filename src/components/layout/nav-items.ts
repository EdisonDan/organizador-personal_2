import {
  Home,
  Flame,
  CalendarDays,
  NotebookPen,
  GraduationCap,
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

// Los 5 accesos principales -- son los mismos que aparecen en la barra
// inferior en móvil, así que el orden importa.
export const mainNavItems: NavItem[] = [
  { href: "/today", label: "Hoy", icon: Home },
  { href: "/habits", label: "Hábitos", icon: Flame },
  { href: "/schedule", label: "Horario", icon: CalendarDays },
  { href: "/notes", label: "Notas", icon: NotebookPen },
  { href: "/subjects", label: "Materias", icon: GraduationCap },
];

export const secondaryNavItems: NavItem[] = [
  { href: "/achievements", label: "Logros", icon: Trophy },
  { href: "/profile", label: "Perfil", icon: User },
  { href: "/settings", label: "Configuración", icon: Settings },
];
