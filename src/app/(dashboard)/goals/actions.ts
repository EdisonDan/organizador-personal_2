"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { scheduleNextReview } from "@/lib/notes/spaced-repetition";
import { createNote } from "@/app/(dashboard)/notes/actions";
import type { GoalStatus, GoalTaskType, GoalResourceType, SubtopicStatus } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No hay sesión activa.");
  return { supabase, user };
}

function revalidateGoals(id?: string) {
  revalidatePath("/goals");
  revalidatePath("/today");
  if (id) revalidatePath(`/goals/${id}`);
}

// ------------------------------------------------------------- Objetivos --

export interface GoalInput {
  title: string;
  description: string | null;
  category: string | null;
  color: string;
  icon: string | null;
  priority: number;
  start_date: string;
  target_date: string | null;
  initial_level: number | null;
  target_level: number | null;
  primary_habit_id: string | null;
  subject_id: string | null;
}

export async function createGoal(input: GoalInput) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from("goals").insert({ ...input, user_id: user.id }).select("id").single();
  if (error) throw new Error(error.message);
  revalidateGoals();
  return data.id as string;
}

export async function updateGoal(id: string, input: GoalInput) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("goals")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateGoals(id);
}

export async function setGoalStatus(id: string, status: GoalStatus) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("goals").update({ status }).eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateGoals();
}

export async function updateGoalProgress(id: string, progress_pct: number) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("goals").update({ progress_pct }).eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
}

export async function deleteGoal(id: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("goals").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateGoals();
}

// -------------------------------------------------------------- Subtemas --

export interface SubtopicInput {
  title: string;
  description: string | null;
  difficulty: number | null;
  estimated_minutes: number | null;
  sort_order: number;
}

export async function createSubtopic(goalId: string, input: SubtopicInput) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("goal_subtopics")
    .insert({ ...input, goal_id: goalId, user_id: user.id })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("goal_reviews").insert({ subtopic_id: data.id, user_id: user.id });
  revalidateGoals(goalId);
}

export async function updateSubtopicStatus(id: string, goalId: string, status: SubtopicStatus) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("goal_subtopics")
    .update({ status, last_studied_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateGoals(goalId);
}

export async function updateSubtopicMinutes(id: string, goalId: string, additionalMinutes: number) {
  const { supabase, user } = await requireUser();
  const { data: current } = await supabase
    .from("goal_subtopics")
    .select("invested_minutes")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<{ invested_minutes: number }>();

  const { error } = await supabase
    .from("goal_subtopics")
    .update({
      invested_minutes: (current?.invested_minutes ?? 0) + additionalMinutes,
      last_studied_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateGoals(goalId);
}

export async function deleteSubtopic(id: string, goalId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("goal_subtopics").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateGoals(goalId);
}

// ---------------------------------------------------------------- Tareas --

export interface TaskInput {
  title: string;
  description: string | null;
  task_type: GoalTaskType;
  subtopic_id: string | null;
  difficulty: number | null;
  priority: number;
  estimated_minutes: number | null;
  suggested_date: string | null;
  due_date: string | null;
  counts_as_habit: boolean;
  sort_order: number;
}

export async function createTask(goalId: string, input: TaskInput) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("goal_tasks").insert({ ...input, goal_id: goalId, user_id: user.id });
  if (error) throw new Error(error.message);
  revalidateGoals(goalId);
}

export async function toggleTask(id: string, goalId: string, completed: boolean) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("goal_tasks").update({ completed }).eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateGoals(goalId);
}

export async function deleteTask(id: string, goalId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("goal_tasks").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateGoals(goalId);
}

// -------------------------------------------------------------- Recursos --

export interface ResourceInput {
  title: string;
  type: GoalResourceType;
  url: string | null;
  subtopic_id: string | null;
}

export async function createResource(goalId: string, input: ResourceInput) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("goal_resources").insert({ ...input, goal_id: goalId, user_id: user.id });
  if (error) throw new Error(error.message);
  revalidateGoals(goalId);
}

export async function updateResourcePage(id: string, goalId: string, currentPage: number) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("goal_resources")
    .update({ current_page: currentPage })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/goals/${goalId}`);
}

export async function deleteResource(id: string, goalId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("goal_resources").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateGoals(goalId);
}

// -------------------------------------------------------- Vínculos hábito --

export async function linkHabit(goalId: string, habitId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("goal_habit_links")
    .insert({ goal_id: goalId, habit_id: habitId, user_id: user.id });
  if (error && !error.message.toLowerCase().includes("duplicate")) throw new Error(error.message);
  revalidateGoals(goalId);
}

export async function unlinkHabit(linkId: string, goalId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("goal_habit_links").delete().eq("id", linkId).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateGoals(goalId);
}

// ---------------------------------------------------------- Vínculos nota --

export async function linkExistingNote(goalId: string, noteId: string, subtopicId: string | null) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("goal_note_links")
    .insert({ goal_id: goalId, note_id: noteId, subtopic_id: subtopicId, user_id: user.id });
  if (error && !error.message.toLowerCase().includes("duplicate")) throw new Error(error.message);
  revalidateGoals(goalId);
}

export async function unlinkNote(linkId: string, goalId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("goal_note_links").delete().eq("id", linkId).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateGoals(goalId);
}

/** Crea una nota nueva y la deja vinculada al objetivo (y opcionalmente a un subtema) desde el mismo flujo. */
export async function createNoteForGoal(
  goalId: string,
  subtopicId: string | null,
  input: { title: string; note_type: "normal" | "flashcards" | "feynman"; subject_id: string | null }
) {
  const { supabase, user } = await requireUser();
  const noteId = await createNote({ ...input, week_id: null });
  const { error } = await supabase
    .from("goal_note_links")
    .insert({ goal_id: goalId, note_id: noteId, subtopic_id: subtopicId, user_id: user.id });
  if (error) throw new Error(error.message);
  revalidateGoals(goalId);
  return noteId;
}

// ----------------------------------------------------------------- Repaso --

export async function markSubtopicReviewed(subtopicId: string, goalId: string, currentStage: number, success: boolean) {
  const { supabase, user } = await requireUser();
  const { interval_stage, next_review_at } = scheduleNextReview(currentStage, success);

  const { error } = await supabase
    .from("goal_reviews")
    .upsert(
      { subtopic_id: subtopicId, user_id: user.id, last_reviewed_at: new Date().toISOString(), interval_stage, next_review_at },
      { onConflict: "subtopic_id" }
    );
  if (error) throw new Error(error.message);
  revalidateGoals(goalId);
}
