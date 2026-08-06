"use client";

import { useEffect, useState } from "react";

const KEY = "panel-personal:sidebar-collapsed";

export function useSidebarCollapsed(): [boolean, (value: boolean) => void] {
  const [collapsed, setCollapsedState] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Se lee la preferencia guardada solo en cliente, para no desajustar la
  // hidratación (el servidor no sabe qué eligió el usuario la vez pasada).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const stored = window.localStorage.getItem(KEY);
    if (stored === "1") setCollapsedState(true);
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function setCollapsed(value: boolean) {
    setCollapsedState(value);
    window.localStorage.setItem(KEY, value ? "1" : "0");
  }

  return [mounted ? collapsed : false, setCollapsed];
}
