"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { scheduleNextReview } from "@/lib/notes/spaced-repetition";
import type { NoteType } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No hay sesión activa.");
  return { supabase, user };
}

function revalidateNotes(id?: string) {
  revalidatePath("/notes");
  revalidatePath("/today");
  if (id) revalidatePath(`/notes/${id}`);
}

const FEYNMAN_TEMPLATE = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Explícalo simple" }] },
    { type: "paragraph", content: [{ type: "text", text: "Como si se lo explicaras a alguien que no sabe nada del tema..." }] },
    { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "¿Dónde te trabaste?" }] },
    { type: "paragraph", content: [{ type: "text", text: "Las partes donde usaste palabras difíciles o no supiste seguir." }] },
    { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Simplifica y usa una analogía" }] },
    { type: "paragraph" },
  ],
};

/** Crea una nota (vacía o con plantilla Feynman) y devuelve su id. */
export async function createNote(input: {
  title: string;
  note_type: NoteType;
  subject_id: string | null;
  week_id: string | null;
}) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("notes")
    .insert({
      ...input,
      user_id: user.id,
      content: input.note_type === "feynman" ? FEYNMAN_TEMPLATE : {},
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("note_reviews").insert({ note_id: data.id, user_id: user.id });

  revalidateNotes();
  return data.id as string;
}

export async function createNoteAndRedirect(input: {
  title: string;
  note_type: NoteType;
  subject_id: string | null;
  week_id: string | null;
}) {
  const id = await createNote(input);
  redirect(`/notes/${id}`);
}

export async function updateNoteContent(id: string, content: object) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("notes")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateNotes(id);
}

export async function updateNoteMeta(
  id: string,
  input: { title: string; tags: string[]; subject_id: string | null; week_id: string | null }
) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("notes")
    .update(input)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateNotes(id);
}

export async function deleteNote(id: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("notes").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateNotes();
}

// ------------------------------------------------------------ Flashcards --

export async function addFlashcard(noteId: string, question: string, answer: string, sortOrder: number) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("flashcards")
    .insert({ note_id: noteId, user_id: user.id, question, answer, sort_order: sortOrder });
  if (error) throw new Error(error.message);
  revalidateNotes(noteId);
}

export async function updateFlashcard(id: string, question: string, answer: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("flashcards")
    .update({ question, answer })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/notes");
}

export async function deleteFlashcard(id: string, noteId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("flashcards").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateNotes(noteId);
}

// --------------------------------------------------------------- Repaso --

/** Registra un repaso y agenda el siguiente según el algoritmo de repetición espaciada. */
export async function markNoteReviewed(noteId: string, currentStage: number, success: boolean) {
  const { supabase, user } = await requireUser();
  const { interval_stage, next_review_at } = scheduleNextReview(currentStage, success);

  const { error } = await supabase
    .from("note_reviews")
    .upsert(
      {
        note_id: noteId,
        user_id: user.id,
        last_reviewed_at: new Date().toISOString(),
        interval_stage,
        next_review_at,
      },
      { onConflict: "note_id" }
    );
  if (error) throw new Error(error.message);
  revalidateNotes(noteId);
}

// ---------------------------------------------------------- Vinculación --

export async function linkNotes(fromNoteId: string, toNoteId: string) {
  if (fromNoteId === toNoteId) return;
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("note_links")
    .insert({ user_id: user.id, from_note_id: fromNoteId, to_note_id: toNoteId });
  if (error && !error.message.includes("duplicate")) throw new Error(error.message);
  revalidateNotes(fromNoteId);
}

export async function unlinkNotes(linkId: string, fromNoteId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("note_links").delete().eq("id", linkId).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidateNotes(fromNoteId);
}
