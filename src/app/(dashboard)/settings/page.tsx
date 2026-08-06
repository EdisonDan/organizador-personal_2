import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";
import { PersonalizationForm } from "@/components/settings/personalization-form";
import { DataManagement } from "@/components/settings/data-management";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Configuración · Panel Personal" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .maybeSingle<Profile>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">Personaliza cómo se ve y se comporta tu panel.</p>
      </div>

      <section className="max-w-lg rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Apariencia</p>
            <p className="text-sm text-muted-foreground">Claro, oscuro o según tu sistema.</p>
          </div>
          <ThemeToggle />
        </div>
      </section>

      {profile && <PersonalizationForm userId={user!.id} profile={profile} />}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Datos</h2>
        <DataManagement />
      </div>
    </div>
  );
}
