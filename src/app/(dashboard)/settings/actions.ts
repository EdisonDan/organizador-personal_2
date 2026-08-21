"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FontPref, Theme } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No hay sesión activa.");
  return { supabase, user };
}

// --------------------------------------------------------- Preferencias --

export interface PreferencesInput {
  theme?: Theme;
  accent_color?: string;
  font_pref?: FontPref;
  background_image_url?: string | null;
  background_color?: string | null;
  week_start_day?: number;
  date_format?: string;
  dashboard_widget_order?: string[];
  visible_sections?: string[];
  section_order?: string[];
}

export async function updatePreferences(input: PreferencesInput) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("profiles").update(input).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

// -------------------------------------------------------------- Export --

const EXPORT_TABLES = [
  "habits",
  "habit_logs",
  "subjects",
  "subject_weeks",
  "subject_topics",
  "deadlines",
  "schedule_blocks",
  "pomodoro_sessions",
  "notes",
  "flashcards",
  "note_reviews",
  "note_links",
  "achievements",
] as const;

export async function exportAllData() {
  const { supabase, user } = await requireUser();

  const results = await Promise.all(
    EXPORT_TABLES.map((table) => supabase.from(table).select("*").eq("user_id", user.id))
  );

  const data: Record<string, unknown[]> = {};
  results.forEach((result, i) => {
    data[EXPORT_TABLES[i]] = result.data ?? [];
  });

  return {
    exported_at: new Date().toISOString(),
    version: 1,
    data,
  };
}

// -------------------------------------------------------------- Import --

// Orden que respeta las llaves foráneas: primero lo que no depende de nada,
// después lo que depende de lo anterior.
const IMPORT_ORDER: (typeof EXPORT_TABLES)[number][] = [
  "habits",
  "subjects",
  "subject_weeks",
  "subject_topics",
  "notes",
  "habit_logs",
  "deadlines",
  "schedule_blocks",
  "pomodoro_sessions",
  "flashcards",
  "note_reviews",
  "note_links",
  "achievements",
];

export async function importAllData(payload: { data: Record<string, Record<string, unknown>[]> }) {
  const { supabase, user } = await requireUser();

  let imported = 0;
  const errors: string[] = [];

  for (const table of IMPORT_ORDER) {
    const rows = payload.data?.[table];
    if (!rows || rows.length === 0) continue;

    // El user_id siempre se fuerza a la sesión actual: nunca se confía en
    // el archivo para decidir de quién son los datos.
    const rowsForThisUser = rows.map((row) => ({ ...row, user_id: user.id }));

    const { error, count } = await supabase
      .from(table)
      .upsert(rowsForThisUser, { onConflict: "id", count: "exact" });

    if (error) {
      errors.push(`${table}: ${error.message}`);
    } else {
      imported += count ?? rowsForThisUser.length;
    }
  }

  revalidatePath("/", "layout");
  return { imported, errors };
}

// --------------------------------------------------------------- Reset --

export async function resetAllData() {
  const { supabase, user } = await requireUser();
  const errors: string[] = [];

  // Basta con borrar las tablas "raíz": las que tienen "on delete cascade"
  // hacia ellas se limpian solas (logs, tarjetas, semanas, temas, etc.).
  const ROOT_TABLES = ["habits", "subjects", "notes", "schedule_blocks", "deadlines", "achievements"] as const;

  for (const table of ROOT_TABLES) {
    const { error } = await supabase.from(table).delete().eq("user_id", user.id);
    if (error) errors.push(`${table}: ${error.message}`);
  }

  revalidatePath("/", "layout");
  return { errors };
}
