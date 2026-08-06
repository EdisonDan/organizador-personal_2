"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FrequencyType, HabitType } from "@/lib/types";

export interface HabitFormInput {
  name: string;
  type: HabitType;
  icon: string | null;
  image_url: string | null;
  color: string;
  category: string | null;
  frequency_type: FrequencyType;
  frequency_config: Record<string, unknown>;
  goal_value: number | null;
  goal_unit: string | null;
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No hay sesión activa.");
  return { supabase, user };
}

function revalidateHabits() {
  revalidatePath("/habits");
  revalidatePath("/today");
}

export async function createHabit(input: HabitFormInput) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("habits").insert({ ...input, user_id: user.id });
  if (error) throw new Error(error.message);
  revalidateHabits();
}

export async function updateHabit(id: string, input: HabitFormInput) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("habits")
    .update(input)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateHabits();
}

export async function archiveHabit(id: string, archived: boolean) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("habits")
    .update({ archived })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateHabits();
}

export async function deleteHabit(id: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("habits").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateHabits();
}

/** Alterna completado/no-completado para un hábito en una fecha (por defecto, hoy). */
export async function toggleHabitLog(habitId: string, date: string, completed: boolean, defaultValue?: number | null) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("habit_logs")
    .upsert(
      {
        habit_id: habitId,
        user_id: user.id,
        date,
        completed,
        value: completed ? (defaultValue ?? null) : null,
      },
      { onConflict: "habit_id,date" }
    );
  if (error) throw new Error(error.message);
  revalidateHabits();
}

/** Guarda el nuevo orden de los hábitos (arrastrar y soltar en la vista "Todos"). */
export async function reorderHabits(orderedIds: string[]) {
  const { supabase, user } = await requireUser();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("habits").update({ sort_order: index }).eq("id", id).eq("user_id", user.id)
    )
  );
  revalidateHabits();
}

export interface HabitLogDetailInput {
  completed: boolean;
  value: number | null;
  note: string | null;
  photo_url: string | null;
}

/** Guarda el detalle completo de un registro (nota, foto, valor exacto) para una fecha. */
export async function upsertHabitLogDetail(habitId: string, date: string, input: HabitLogDetailInput) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("habit_logs")
    .upsert(
      { habit_id: habitId, user_id: user.id, date, ...input },
      { onConflict: "habit_id,date" }
    );
  if (error) throw new Error(error.message);
  revalidateHabits();
}
