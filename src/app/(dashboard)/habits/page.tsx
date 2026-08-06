import { createClient } from "@/lib/supabase/server";
import { HabitsClient } from "@/components/habits/habits-client";
import type { Habit, HabitLog } from "@/lib/types";

export const metadata = { title: "Hábitos · Panel Personal" };

export default async function HabitsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: habits }, { data: logs }] = await Promise.all([
    supabase
      .from("habits")
      .select("*")
      .eq("user_id", user!.id)
      .eq("archived", false)
      .order("sort_order")
      .order("created_at")
      .returns<Habit[]>(),
    supabase
      .from("habit_logs")
      .select("*")
      .eq("user_id", user!.id)
      .returns<HabitLog[]>(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Hábitos</h1>
        <p className="text-sm text-muted-foreground">
          Positivos y negativos, con racha y escala de color por desempeño.
        </p>
      </div>

      <HabitsClient userId={user!.id} habits={habits ?? []} logs={logs ?? []} />
    </div>
  );
}
