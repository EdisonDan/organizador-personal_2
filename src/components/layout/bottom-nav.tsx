"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { primaryNavItems, utilityNavItems, BOTTOM_NAV_VISIBLE_COUNT } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const visible = primaryNavItems.slice(0, BOTTOM_NAV_VISIBLE_COUNT);
  const overflow = [...primaryNavItems.slice(BOTTOM_NAV_VISIBLE_COUNT), ...utilityNavItems];
  const overflowHasActive = overflow.some((item) => isActive(pathname, item.href));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 backdrop-blur md:hidden">
        {visible.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
            overflowHasActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          Más
        </button>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative w-full rounded-t-2xl border border-border bg-card p-4 pb-8 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Más</p>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Cerrar"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {overflow.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-[11px] font-medium",
                      active ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-center leading-tight">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}
