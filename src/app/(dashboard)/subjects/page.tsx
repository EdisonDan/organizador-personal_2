import { createClient } from "@/lib/supabase/server";
import { SubjectsClient } from "@/components/subjects/subjects-client";
import type { Subject, SubjectWeek, SubjectTopic } from "@/lib/types";

export const metadata = { title: "Materias · Panel Personal" };

export default async function SubjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: subjects }, { data: weeks }, { data: topics }] = await Promise.all([
    supabase
      .from("subjects")
      .select("*")
      .eq("user_id", user!.id)
      .eq("archived", false)
      .order("sort_order")
      .order("created_at")
      .returns<Subject[]>(),
    supabase.from("subject_weeks").select("*").eq("user_id", user!.id).returns<SubjectWeek[]>(),
    supabase.from("subject_topics").select("*").eq("user_id", user!.id).returns<SubjectTopic[]>(),
  ]);

  const weekToSubject = new Map((weeks ?? []).map((w) => [w.id, w.subject_id]));
  const topicsBySubject = new Map<string, SubjectTopic[]>();
  for (const topic of topics ?? []) {
    const subjectId = weekToSubject.get(topic.week_id);
    if (!subjectId) continue;
    if (!topicsBySubject.has(subjectId)) topicsBySubject.set(subjectId, []);
    topicsBySubject.get(subjectId)!.push(topic);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Materias</h1>
        <p className="text-sm text-muted-foreground">Organización por semana, con progreso e interleaving.</p>
      </div>

      <SubjectsClient userId={user!.id} subjects={subjects ?? []} topicsBySubject={topicsBySubject} />
    </div>
  );
}
