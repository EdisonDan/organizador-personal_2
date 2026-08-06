"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BlockType, DeadlineType } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No hay sesión activa.");
  return { supabase, user };
}

function revalidateSchedule() {
  revalidatePath("/schedule");
  revalidatePath("/today");
}

// ---------------------------------------------------------------- Bloques --

export interface ScheduleBlockInput {
  title: string;
  block_type: BlockType;
  day_of_week: number | null;
  specific_date: string | null;
  start_time: string;
  end_time: string;
  repeats: boolean;
  subject_id: string | null;
  habit_id: string | null;
  color: string | null;
}

export async function createScheduleBlock(input: ScheduleBlockInput) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("schedule_blocks").insert({ ...input, user_id: user.id });
  if (error) throw new Error(error.message);
  revalidateSchedule();
}

export async function updateScheduleBlock(id: string, input: Partial<ScheduleBlockInput>) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("schedule_blocks")
    .update(input)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateSchedule();
}

export async function deleteScheduleBlock(id: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("schedule_blocks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateSchedule();
}

/** Mueve un bloque a otro día/hora manteniendo su duración (usado por drag & drop). */
export async function moveScheduleBlock(
  id: string,
  target: { day_of_week: number | null; specific_date: string | null; start_time: string; end_time: string }
) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("schedule_blocks")
    .update(target)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateSchedule();
}

// -------------------------------------------------------------- Entregas --

export interface DeadlineInput {
  title: string;
  due_date: string; // ISO
  type: DeadlineType;
  subject_id: string | null;
}

export async function createDeadline(input: DeadlineInput) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("deadlines").insert({ ...input, user_id: user.id });
  if (error) throw new Error(error.message);
  revalidateSchedule();
}

export async function toggleDeadline(id: string, completed: boolean) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("deadlines")
    .update({ completed })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateSchedule();
}

export async function deleteDeadline(id: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("deadlines").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateSchedule();
}

// -------------------------------------------------------------- Pomodoro --

export async function logPomodoroSession(input: {
  subject_id: string | null;
  schedule_block_id: string | null;
  started_at: string;
  duration_minutes: number;
}) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("pomodoro_sessions")
    .insert({ ...input, user_id: user.id, completed: true });
  if (error) throw new Error(error.message);
  revalidatePath("/schedule");
}
