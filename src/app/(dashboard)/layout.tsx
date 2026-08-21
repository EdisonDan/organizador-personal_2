import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGlobalStats } from "@/lib/gamification/get-global-stats";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TopBar } from "@/components/layout/topbar";
import { PersonalizationProvider } from "@/components/personalization-provider";
import type { Profile } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El proxy ya protege estas rutas, esto es una segunda capa de seguridad.
  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, stats] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>(),
    getGlobalStats(supabase, user.id),
  ]);

  const displayName =
    profile?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "";

  return (
    <PersonalizationProvider
      accentColor={profile?.accent_color ?? "teal"}
      fontPref={profile?.font_pref ?? "sans"}
      backgroundColor={profile?.background_color}
    >
      {profile?.background_image_url && (
        <>
          <div
            className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${profile.background_image_url})` }}
          />
          {/* Capa encima de la imagen para que el texto siga siendo legible */}
          <div className="pointer-events-none fixed inset-0 z-0 bg-background/85" />
        </>
      )}
      <div className="relative z-10 flex min-h-screen">
        <Sidebar visibleSections={profile?.visible_sections ?? []} sectionOrder={profile?.section_order ?? []} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar displayName={displayName} streak={stats.currentStreak} points={stats.points} />
          <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
        <BottomNav visibleSections={profile?.visible_sections ?? []} sectionOrder={profile?.section_order ?? []} />
      </div>
    </PersonalizationProvider>
  );
}
