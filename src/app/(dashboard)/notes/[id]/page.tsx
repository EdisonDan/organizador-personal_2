import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NoteDetailClient } from "@/components/notes/note-detail-client";
import type { Note, Flashcard, NoteReview, NoteLink, Subject } from "@/lib/types";

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: note }, { data: flashcards }, { data: review }, { data: links }, { data: allNotes }, { data: subjects }] =
    await Promise.all([
      supabase.from("notes").select("*").eq("id", id).eq("user_id", user!.id).maybeSingle<Note>(),
      supabase
        .from("flashcards")
        .select("*")
        .eq("note_id", id)
        .eq("user_id", user!.id)
        .order("sort_order")
        .returns<Flashcard[]>(),
      supabase
        .from("note_reviews")
        .select("*")
        .eq("note_id", id)
        .eq("user_id", user!.id)
        .maybeSingle<NoteReview>(),
      supabase
        .from("note_links")
        .select("*")
        .eq("user_id", user!.id)
        .or(`from_note_id.eq.${id},to_note_id.eq.${id}`)
        .returns<NoteLink[]>(),
      supabase.from("notes").select("*").eq("user_id", user!.id).returns<Note[]>(),
      supabase
        .from("subjects")
        .select("*")
        .eq("user_id", user!.id)
        .eq("archived", false)
        .returns<Subject[]>(),
    ]);

  if (!note) notFound();

  const linkedIds = new Set(
    (links ?? []).map((l) => (l.from_note_id === id ? l.to_note_id : l.from_note_id))
  );
  const linkedNotes = (allNotes ?? []).filter((n) => linkedIds.has(n.id));
  const otherNotes = (allNotes ?? []).filter((n) => n.id !== id && !linkedIds.has(n.id));

  return (
    <div className="space-y-4">
      <Link
        href="/notes"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Notas
      </Link>
      <NoteDetailClient
        note={note}
        flashcards={flashcards ?? []}
        review={review ?? null}
        links={links ?? []}
        linkedNotes={linkedNotes}
        otherNotes={otherNotes}
        subjects={subjects ?? []}
      />
    </div>
  );
}
