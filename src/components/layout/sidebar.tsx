"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALWAYS_VISIBLE_ITEMS, getVisibleSections, type NavItem } from "./nav-items";
import { useSidebarCollapsed } from "./use-sidebar-collapsed";

export function Sidebar({
  visibleSections,
  sectionOrder,
}: {
  visibleSections: string[];
  sectionOrder: string[];
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useSidebarCollapsed();
  const sections = getVisibleSections(visibleSections, sectionOrder);

  return (
    <aside
      className={cn(
        "relative hidden shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 md:flex",
        collapsed ? "w-[68px]" : "w-60"
      )}
    >
      <div className={cn("flex h-16 items-center gap-2 px-5", collapsed && "justify-center px-0")}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <LayoutGrid className="h-4 w-4" />
        </span>
        {!collapsed && <span className="truncate font-semibold tracking-tight">Panel Personal</span>}
      </div>

      <nav className={cn("flex flex-1 flex-col justify-between px-3 pb-4", collapsed && "px-2")}>
        <div className="space-y-1">
          {sections.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={collapsed} />
          ))}
        </div>

        <div className="space-y-1 border-t border-border pt-3">
          {ALWAYS_VISIBLE_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expandir panel" : "Contraer panel"}
        className="absolute -right-3 top-16 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
      >
        <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform", collapsed && "rotate-180")} />
      </button>
    </aside>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-primary-soft text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}
