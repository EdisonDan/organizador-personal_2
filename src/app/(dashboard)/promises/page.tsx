import { createClient } from "@/lib/supabase/server";
import { PromisesClient } from "@/components/promises/promises-client";
import type { Promise_, Habit } from "@/lib/types";

export const metadata = { title: "Promesas · Panel Personal" };

export default async function PromisesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: promises }, { data: habits }] = await Promise.all([
    supabase
      .from("promises")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .returns<Promise_[]>(),
    supabase
      .from("habits")
      .select("*")
      .eq("user_id", user!.id)
      .eq("archived", false)
      .returns<Habit[]>(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Promesas</h1>
        <p className="text-sm text-muted-foreground">Compromisos personales y aspiracionales, del año, de cambio, creativos o personales.</p>
      </div>

      <PromisesClient promises={promises ?? []} habits={habits ?? []} />
    </div>
  );
}
