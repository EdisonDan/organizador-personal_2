import { createClient } from "@/lib/supabase/server";
import { NotesClient } from "@/components/notes/notes-client";
import type { Note, NoteReview, Subject } from "@/lib/types";

export const metadata = { title: "Notas · Panel Personal" };

export default async function NotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: notes }, { data: reviews }, { data: subjects }] = await Promise.all([
    supabase
      .from("notes")
      .select("*")
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false })
      .returns<Note[]>(),
    supabase.from("note_reviews").select("*").eq("user_id", user!.id).returns<NoteReview[]>(),
    supabase
      .from("subjects")
      .select("*")
      .eq("user_id", user!.id)
      .eq("archived", false)
      .returns<Subject[]>(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Notas</h1>
        <p className="text-sm text-muted-foreground">
          Recuperación activa, repetición espaciada y técnica Feynman.
        </p>
      </div>

      <NotesClient notes={notes ?? []} reviews={reviews ?? []} subjects={subjects ?? []} />
    </div>
  );
}
