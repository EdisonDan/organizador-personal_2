"use client";

import { useEffect, useState } from "react";
import { GripVertical } from "lucide-react";
import { updatePreferences } from "@/app/(dashboard)/settings/actions";

export function DashboardWidgetsGrid({
  order,
  widgets,
}: {
  order: string[];
  widgets: Record<string, React.ReactNode>;
}) {
  const validOrder = order.filter((id) => id in widgets);
  const missing = Object.keys(widgets).filter((id) => !validOrder.includes(id));
  const [currentOrder, setCurrentOrder] = useState<string[]>([...validOrder, ...missing]);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Si cambia el orden guardado en el servidor (otra pestaña, u otra sesión),
  // el estado local se resincroniza sin perder lo que se está arrastrando.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setCurrentOrder([...validOrder, ...missing]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.join(",")]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) return;
    const next = [...currentOrder];
    const from = next.indexOf(draggingId);
    const to = next.indexOf(targetId);
    if (from === -1 || to === -1) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setCurrentOrder(next);
    setDraggingId(null);
    updatePreferences({ dashboard_widget_order: next }).catch(() => {});
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {currentOrder.map((id) => (
        <div
          key={id}
          draggable
          onDragStart={() => setDraggingId(id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(id)}
          className="group relative"
        >
          <span className="pointer-events-none absolute -left-1 top-4 hidden text-muted-foreground/50 group-hover:block">
            <GripVertical className="h-4 w-4" />
          </span>
          {widgets[id]}
        </div>
      ))}
    </div>
  );
}
