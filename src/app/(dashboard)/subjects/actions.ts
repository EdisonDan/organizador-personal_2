"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No hay sesión activa.");
  return { supabase, user };
}

function revalidateSubjects(id?: string) {
  revalidatePath("/subjects");
  revalidatePath("/today");
  revalidatePath("/schedule");
  if (id) revalidatePath(`/subjects/${id}`);
}

// -------------------------------------------------------------- Materias --

export interface SubjectInput {
  name: string;
  color: string;
  icon: string | null;
  cover_image_url: string | null;
  semester_label: string | null;
  semester_start_date: string | null;
  semester_weeks: number;
}

/** Crea la materia y genera automáticamente sus N semanas (1..semester_weeks). */
export async function createSubject(input: SubjectInput) {
  const { supabase, user } = await requireUser();
  const { data: subject, error } = await supabase
    .from("subjects")
    .insert({ ...input, user_id: user.id })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const weeks = Array.from({ length: input.semester_weeks }, (_, i) => ({
    subject_id: subject.id,
    user_id: user.id,
    week_number: i + 1,
  }));
  if (weeks.length > 0) {
    const { error: weeksError } = await supabase.from("subject_weeks").insert(weeks);
    if (weeksError) throw new Error(weeksError.message);
  }

  revalidateSubjects();
  return subject.id as string;
}

export async function updateSubject(id: string, input: Partial<SubjectInput>) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("subjects")
    .update(input)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateSubjects(id);
}

export async function archiveSubject(id: string, archived: boolean) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("subjects")
    .update({ archived })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateSubjects();
}

export async function deleteSubject(id: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("subjects").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateSubjects();
}

// ---------------------------------------------------------------- Semanas --

export async function updateWeekTitle(id: string, title: string, subjectId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("subject_weeks")
    .update({ title: title.trim() || null })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateSubjects(subjectId);
}

// ----------------------------------------------------------------- Temas --

export async function createTopic(
  weekId: string,
  subjectId: string,
  input: { title: string; description: string | null; due_date: string | null; sort_order: number }
) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("subject_topics")
    .insert({ ...input, week_id: weekId, user_id: user.id });
  if (error) throw new Error(error.message);
  revalidateSubjects(subjectId);
}

export async function toggleTopic(id: string, completed: boolean, subjectId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("subject_topics")
    .update({ completed })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateSubjects(subjectId);
}

export async function deleteTopic(id: string, subjectId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("subject_topics").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateSubjects(subjectId);
}

// -------------------------------------------------- Vínculos tema -> nota/bloque --

export async function linkTopicToNote(noteId: string, topicId: string, subjectId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("notes")
    .update({ topic_id: topicId })
    .eq("id", noteId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateSubjects(subjectId);
}

export async function unlinkTopicFromNote(noteId: string, subjectId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("notes")
    .update({ topic_id: null })
    .eq("id", noteId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateSubjects(subjectId);
}

export async function linkTopicToBlock(blockId: string, topicId: string, subjectId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("schedule_blocks")
    .update({ topic_id: topicId })
    .eq("id", blockId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateSubjects(subjectId);
}

export async function unlinkTopicFromBlock(blockId: string, subjectId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("schedule_blocks")
    .update({ topic_id: null })
    .eq("id", blockId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateSubjects(subjectId);
}
