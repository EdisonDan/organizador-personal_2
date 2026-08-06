import { Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getGlobalStats } from "@/lib/gamification/get-global-stats";
import { syncAndGetAchievements } from "@/lib/gamification/sync-achievements";
import { AchievementGallery } from "@/components/achievements/achievement-gallery";

export const metadata = { title: "Logros · Panel Personal" };

export default async function AchievementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [stats, achievements] = await Promise.all([
    getGlobalStats(supabase, user!.id),
    syncAndGetAchievements(user!.id),
  ]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Logros</h1>
        <p className="text-sm text-muted-foreground">Puntos, niveles e insignias por constancia.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Puntos" value={stats.points} />
        <StatCard label="Nivel" value={stats.level} sub={`${stats.pointsIntoLevel}/${stats.pointsForNextLevel} para el siguiente`} />
        <StatCard label="Insignias" value={`${unlockedCount}/${achievements.length}`} />
      </div>

      <div className="flex items-center gap-1.5">
        <Trophy className="h-4 w-4 text-gold" />
        <h2 className="text-sm font-semibold text-foreground">Galería</h2>
      </div>
      <AchievementGallery achievements={achievements} />
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center">
      <p className="tabular-stat text-2xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="tabular-stat mt-1 text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
