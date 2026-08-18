"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { syncAndGetAchievements } from "@/lib/gamification/sync-achievements";
import type { PromiseType } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No hay sesión activa.");
  return { supabase, user };
}

function revalidatePromises() {
  revalidatePath("/promises");
  revalidatePath("/achievements");
  revalidatePath("/profile");
  revalidatePath("/today");
}

export interface PromiseInput {
  title: string;
  description: string | null;
  type: PromiseType;
  ideas: string | null;
  related_goal_id: string | null;
  related_habit_id: string | null;
}

export async function createPromise(input: PromiseInput) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("promises").insert({ ...input, user_id: user.id });
  if (error) throw new Error(error.message);
  revalidatePromises();
}

export async function updatePromise(id: string, input: PromiseInput) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("promises")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePromises();
}

/** Marca la promesa como cumplida y revisa de inmediato si esto desbloquea algún logro nuevo. */
export async function completePromise(id: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("promises")
    .update({ status: "completed", completed_date: new Date().toISOString().slice(0, 10) })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  await syncAndGetAchievements(user.id);
  revalidatePromises();
}

export async function setPromiseStatus(id: string, status: "active" | "paused" | "archived") {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("promises")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePromises();
}

export async function deletePromise(id: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("promises").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePromises();
}
