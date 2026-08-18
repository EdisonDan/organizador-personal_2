import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getGlobalStats } from "@/lib/gamification/get-global-stats";
import type { Profile, Promise_ } from "@/lib/types";

export const metadata = { title: "Perfil · Panel Personal" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, stats, { data: lastPromise }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle<Profile>(),
    getGlobalStats(supabase, user!.id),
    supabase
      .from("promises")
      .select("*")
      .eq("user_id", user!.id)
      .eq("status", "completed")
      .order("completed_date", { ascending: false })
      .limit(1)
      .maybeSingle<Promise_>(),
  ]);

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "";
  const initial = displayName?.[0]?.toUpperCase() || "?";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Perfil</h1>
        <p className="text-sm text-muted-foreground">Tu información de cuenta.</p>
      </div>

      <section className="max-w-lg rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            {initial}
          </span>
          <div>
            <p className="font-medium text-foreground">{displayName}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6 text-sm">
          <div>
            <dt className="text-muted-foreground">Puntos</dt>
            <dd className="tabular-stat mt-0.5 text-base font-semibold text-foreground">{stats.points}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Nivel</dt>
            <dd className="tabular-stat mt-0.5 text-base font-semibold text-foreground">{stats.level}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Racha actual</dt>
            <dd className="tabular-stat mt-0.5 text-base font-semibold text-foreground">
              {stats.currentStreak} días
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Racha más larga</dt>
            <dd className="tabular-stat mt-0.5 text-base font-semibold text-foreground">
              {stats.longestStreak} días
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Promesas cumplidas</dt>
            <dd className="tabular-stat mt-0.5 text-base font-semibold text-foreground">
              {stats.counts.promisesCompleted}
            </dd>
          </div>
        </dl>
      </section>

      {lastPromise && (
        <section className="max-w-lg rounded-2xl border border-gold/30 bg-gold-soft p-5">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gold">
            <Sparkles className="h-3.5 w-3.5" />
            Última promesa cumplida
          </p>
          <p className="text-sm font-medium text-foreground">{lastPromise.title}</p>
          {lastPromise.completed_date && (
            <p className="tabular-stat mt-0.5 text-xs text-muted-foreground">{lastPromise.completed_date}</p>
          )}
        </section>
      )}
    </div>
  );
}
