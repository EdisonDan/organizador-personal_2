import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SubjectDetailClient } from "@/components/subjects/subject-detail-client";
import type { Subject, SubjectWeek, SubjectTopic, Note, ScheduleBlock, Deadline } from "@/lib/types";

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: subject },
    { data: weeks },
    { data: notes },
    { data: blocks },
    { data: deadlines },
  ] = await Promise.all([
    supabase.from("subjects").select("*").eq("id", id).eq("user_id", user!.id).maybeSingle<Subject>(),
    supabase
      .from("subject_weeks")
      .select("*")
      .eq("subject_id", id)
      .eq("user_id", user!.id)
      .order("week_number")
      .returns<SubjectWeek[]>(),
    supabase.from("notes").select("*").eq("user_id", user!.id).returns<Note[]>(),
    supabase.from("schedule_blocks").select("*").eq("user_id", user!.id).returns<ScheduleBlock[]>(),
    supabase
      .from("deadlines")
      .select("*")
      .eq("subject_id", id)
      .eq("user_id", user!.id)
      .order("due_date")
      .returns<Deadline[]>(),
  ]);

  if (!subject) notFound();

  const weekIds = new Set((weeks ?? []).map((w) => w.id));
  const { data: topics } = await supabase
    .from("subject_topics")
    .select("*")
    .eq("user_id", user!.id)
    .in("week_id", Array.from(weekIds))
    .returns<SubjectTopic[]>();

  const subjectNotes = (notes ?? []).filter((n) => n.subject_id === id);
  const subjectBlocks = (blocks ?? []).filter((b) => b.subject_id === id);
  const availableNotes = subjectNotes.filter((n) => !n.topic_id);
  const availableBlocks = subjectBlocks.filter((b) => !b.topic_id && b.block_type === "study");

  return (
    <div className="space-y-4">
      <Link
        href="/subjects"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Materias
      </Link>
      <SubjectDetailClient
        userId={user!.id}
        subject={subject}
        weeks={weeks ?? []}
        topics={topics ?? []}
        notes={subjectNotes}
        blocks={subjectBlocks}
        deadlines={deadlines ?? []}
        availableNotes={availableNotes}
        availableBlocks={availableBlocks}
      />
    </div>
  );
}
