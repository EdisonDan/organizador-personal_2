"use client";

import { useEffect, useState } from "react";
import { GripVertical, EyeOff } from "lucide-react";
import { HIDEABLE_SECTIONS, DEFAULT_SECTION_ORDER } from "@/components/layout/nav-items";
import { updatePreferences } from "@/app/(dashboard)/settings/actions";

export function PanelPersonalizationForm({
  initialVisible,
  initialOrder,
}: {
  initialVisible: string[];
  initialOrder: string[];
}) {
  const [order, setOrder] = useState(initialOrder.length > 0 ? initialOrder : DEFAULT_SECTION_ORDER);
  const [visible, setVisible] = useState(new Set(initialVisible.length > 0 ? initialVisible : DEFAULT_SECTION_ORDER));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Si aparece una sección nueva que la app agregó después de guardar la
  // preferencia (ej. Objetivos), se agrega al final sin perder el resto.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setOrder((prev) => {
      const missing = DEFAULT_SECTION_ORDER.filter((id) => !prev.includes(id));
      return missing.length > 0 ? [...prev, ...missing] : prev;
    });
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function persist(nextVisible: Set<string>, nextOrder: string[]) {
    updatePreferences({ visible_sections: Array.from(nextVisible), section_order: nextOrder }).catch(() => {});
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function toggle(id: string) {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      persist(next, order);
      return next;
    });
  }

  function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) return;
    const next = [...order];
    const from = next.indexOf(draggingId);
    const to = next.indexOf(targetId);
    if (from === -1 || to === -1) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setOrder(next);
    setDraggingId(null);
    persist(visible, next);
  }

  const items = order.map((id) => HIDEABLE_SECTIONS.find((s) => s.id === id)).filter((s): s is (typeof HIDEABLE_SECTIONS)[number] => Boolean(s));

  return (
    <section className="max-w-lg rounded-2xl border border-border bg-card p-6">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Personalizar panel</p>
        {saved && <span className="text-xs font-medium text-primary">Guardado</span>}
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Oculta las secciones que no uses y arrastra para reordenar las que sí. No se borra ningún dato, solo cambia qué
        aparece en el menú.
      </p>

      <ul className="space-y-1.5">
        {items.map((item) => {
          const isVisible = visible.has(item.id);
          const Icon = item.icon;
          return (
            <li
              key={item.id}
              draggable
              onDragStart={() => setDraggingId(item.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(item.id)}
              className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2"
            >
              <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground/50" />
              <Icon className={`h-4 w-4 shrink-0 ${isVisible ? "text-foreground" : "text-muted-foreground"}`} />
              <span className={`flex-1 text-sm ${isVisible ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
              {!isVisible && <EyeOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
              <button
                type="button"
                role="switch"
                aria-checked={isVisible}
                aria-label={`${isVisible ? "Ocultar" : "Mostrar"} ${item.label}`}
                onClick={() => toggle(item.id)}
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${isVisible ? "bg-primary" : "bg-muted"}`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    isVisible ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
