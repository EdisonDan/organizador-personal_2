import {
  Footprints,
  Flame,
  CalendarCheck,
  Timer,
  Trophy,
  BookMarked,
  GraduationCap,
  Star,
  Heart,
  Gem,
  Crown,
  Sparkles,
  Palette,
  Lock,
  type LucideIcon,
} from "lucide-react";
import type { AchievementView } from "@/lib/gamification/sync-achievements";
import type { AchievementType } from "@/lib/gamification/achievements";

const ICONS: Record<AchievementType, LucideIcon> = {
  first_habit: Footprints,
  week_streak: Flame,
  month_streak: CalendarCheck,
  pomodoro_starter: Timer,
  pomodoro_master: Trophy,
  review_master: BookMarked,
  subject_complete: GraduationCap,
  level_5: Star,
  first_promise_completed: Heart,
  five_promises_completed: Gem,
  ten_promises_completed: Crown,
  yearly_promise_completed: Sparkles,
  creative_promise_completed: Palette,
};

export function AchievementGallery({ achievements }: { achievements: AchievementView[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {achievements.map((a) => {
        const Icon = ICONS[a.type];
        return (
          <div
            key={a.type}
            className={`flex flex-col items-center gap-2 rounded-2xl border p-5 text-center ${
              a.unlocked ? "border-gold/40 bg-gold-soft" : "border-border bg-card"
            }`}
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                a.unlocked ? "bg-gold text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {a.unlocked ? <Icon className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
            </span>
            <p className={`text-sm font-medium ${a.unlocked ? "text-foreground" : "text-muted-foreground"}`}>
              {a.title}
            </p>
            <p className="text-xs text-muted-foreground">{a.description}</p>
            {a.unlocked && a.unlockedAt && (
              <p className="tabular-stat text-[10px] text-gold">
                {new Date(a.unlockedAt).toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
