import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { HabitDetailClient } from "@/components/habits/habit-detail-client";
import type { Habit, HabitLog } from "@/lib/types";

export default async function HabitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: habit }, { data: logs }] = await Promise.all([
    supabase.from("habits").select("*").eq("id", id).eq("user_id", user!.id).maybeSingle<Habit>(),
    supabase
      .from("habit_logs")
      .select("*")
      .eq("habit_id", id)
      .eq("user_id", user!.id)
      .returns<HabitLog[]>(),
  ]);

  if (!habit) notFound();

  return (
    <div className="space-y-4">
      <Link
        href="/habits"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Hábitos
      </Link>
      <HabitDetailClient userId={user!.id} habit={habit} logs={logs ?? []} />
    </div>
  );
}
