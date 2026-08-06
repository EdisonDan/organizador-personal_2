import Link from "next/link";
import {
  Flame,
  CalendarClock,
  NotebookPen,
  GraduationCap,
  ArrowRight,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { DashboardWidgetsGrid } from "@/components/dashboard/dashboard-widgets-grid";
import { subjectProgress } from "@/lib/subjects/progress";
import { getPerformanceColor } from "@/lib/habits/color-scale";
import type { Habit, HabitLog, ScheduleBlock, Subject, SubjectWeek, SubjectTopic, Profile } from "@/lib/types";

export const metadata = { title: "Hoy · Panel Personal" };

interface DueReview {
  next_review_at: string;
  notes: { id: string; title: string } | null;
}

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const todayISO = new Date().toISOString().slice(0, 10);
  const dayOfWeek = new Date().getDay();
  const nowTime = new Date().toTimeString().slice(0, 8);

  const [
    { data: habits },
    { data: logsToday },
    { data: nextBlocks },
    { data: subjects },
    { data: dueReviews },
    { data: weeks },
    { data: topics },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from("habits")
      .select("*")
      .eq("user_id", user!.id)
      .eq("archived", false)
      .order("sort_order")
      .returns<Habit[]>(),
    supabase
      .from("habit_logs")
      .select("*")
      .eq("user_id", user!.id)
      .eq("date", todayISO)
      .returns<HabitLog[]>(),
    supabase
      .from("schedule_blocks")
      .select("*")
      .eq("user_id", user!.id)
      .eq("day_of_week", dayOfWeek)
      .gte("start_time", nowTime)
      .order("start_time")
      .limit(1)
      .returns<ScheduleBlock[]>(),
    supabase
      .from("subjects")
      .select("*")
      .eq("user_id", user!.id)
      .eq("archived", false)
      .order("sort_order")
      .returns<Subject[]>(),
    supabase
      .from("note_reviews")
      .select("next_review_at, notes(id, title)")
      .eq("user_id", user!.id)
      .lte("next_review_at", todayISO)
      .order("next_review_at")
      .limit(5)
      .returns<DueReview[]>(),
    supabase.from("subject_weeks").select("*").eq("user_id", user!.id).returns<SubjectWeek[]>(),
    supabase.from("subject_topics").select("*").eq("user_id", user!.id).returns<SubjectTopic[]>(),
    supabase
      .from("profiles")
      .select("dashboard_widget_order")
      .eq("id", user!.id)
      .maybeSingle<Pick<Profile, "dashboard_widget_order">>(),
  ]);

  const weekToSubject = new Map((weeks ?? []).map((w) => [w.id, w.subject_id]));
  const topicsBySubject = new Map<string, SubjectTopic[]>();
  for (const topic of topics ?? []) {
    const subjectId = weekToSubject.get(topic.week_id);
    if (!subjectId) continue;
    if (!topicsBySubject.has(subjectId)) topicsBySubject.set(subjectId, []);
    topicsBySubject.get(subjectId)!.push(topic);
  }

  const habitCount = habits?.length ?? 0;
  const completedToday = logsToday?.filter((l) => l.completed).length ?? 0;
  const nextBlock = nextBlocks?.[0] ?? null;
  const subjectCount = subjects?.length ?? 0;

  const widgets: Record<string, React.ReactNode> = {
    habits: (
      <Card title="Hábitos de hoy" href="/habits" icon={Flame}>
        {habitCount === 0 ? (
          <EmptyState
            icon={Flame}
            title="Aún no tienes hábitos"
            description="Crea el primero y empieza a construir tu racha."
            actionLabel="Crear hábito"
            actionHref="/habits"
          />
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="tabular-stat text-2xl font-semibold">{completedToday}</span>
              <span className="text-sm text-muted-foreground">/ {habitCount} completados</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${habitCount ? (completedToday / habitCount) * 100 : 0}%`,
                  backgroundColor: getPerformanceColor(habitCount ? (completedToday / habitCount) * 100 : 0),
                }}
              />
            </div>
          </div>
        )}
      </Card>
    ),
    next_block: (
      <Card title="Próximo bloque" href="/schedule" icon={CalendarClock}>
        {nextBlock ? (
          <div>
            <p className="font-medium text-foreground">{nextBlock.title}</p>
            <p className="tabular-stat text-sm text-muted-foreground">
              {nextBlock.start_time.slice(0, 5)} – {nextBlock.end_time.slice(0, 5)}
            </p>
          </div>
        ) : (
          <EmptyState
            icon={CalendarClock}
            title="No tienes bloques hoy"
            description="Arma tu horario semanal con clases, estudio y descansos."
            actionLabel="Ir a Horario"
            actionHref="/schedule"
          />
        )}
      </Card>
    ),
    notes_review: (
      <Card title="Notas para repasar" href="/notes" icon={NotebookPen}>
        {!dueReviews || dueReviews.length === 0 ? (
          <EmptyState
            icon={NotebookPen}
            title="Nada pendiente de repaso"
            description="Cuando crees notas, aquí verás las que tocan repasar hoy."
            actionLabel="Ir a Notas"
            actionHref="/notes"
          />
        ) : (
          <ul className="space-y-2">
            {dueReviews.map((r) =>
              r.notes ? (
                <li key={r.notes.id}>
                  <Link
                    href={`/notes/${r.notes.id}`}
                    className="flex items-center justify-between gap-2 truncate text-sm text-foreground hover:text-primary"
                  >
                    <span className="truncate">{r.notes.title}</span>
                  </Link>
                </li>
              ) : null
            )}
          </ul>
        )}
      </Card>
    ),
    subjects: (
      <Card title="Materias" href="/subjects" icon={GraduationCap}>
        {subjectCount === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="Agrega tus materias"
            description="Organiza cada curso por semana y sigue tu progreso del semestre."
            actionLabel="Agregar materia"
            actionHref="/subjects"
          />
        ) : (
          <ul className="space-y-2.5">
            {subjects!.slice(0, 4).map((s) => {
              const progress = subjectProgress(topicsBySubject.get(s.id) ?? []);
              return (
                <li key={s.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-foreground">{s.name}</span>
                    <span className="tabular-stat shrink-0 text-xs text-muted-foreground">{progress.pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progress.pct}%`, backgroundColor: s.color }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    ),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Hoy</h1>
        <p className="text-sm text-muted-foreground">{formatFecha(new Date())}</p>
      </div>

      <MotivationalBanner habitCount={habitCount} completedToday={completedToday} />

      <DashboardWidgetsGrid
        order={profile?.dashboard_widget_order ?? ["habits", "next_block", "notes_review", "subjects"]}
        widgets={widgets}
      />
    </div>
  );
}

function Card({
  title,
  href,
  icon: Icon,
  children,
}: {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        </div>
        <Link
          href={href}
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary"
        >
          Ver todo <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {children}
    </section>
  );
}

function MotivationalBanner({
  habitCount,
  completedToday,
}: {
  habitCount: number;
  completedToday: number;
}) {
  let message = "Bienvenido a tu panel. Empieza creando tu primer hábito o materia.";
  if (habitCount > 0 && completedToday === 0) {
    message = "Todavía no marcas nada hoy. ¡Vamos por el primero!";
  } else if (habitCount > 0 && completedToday === habitCount) {
    message = "Completaste todos tus hábitos de hoy. Buen trabajo.";
  } else if (habitCount > 0) {
    message = `Vas ${completedToday} de ${habitCount} hoy. Sigue así.`;
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary-soft px-5 py-4">
      <p className="text-sm font-medium text-foreground">{message}</p>
      <Plus className="hidden h-4 w-4 shrink-0 text-primary sm:block" />
    </div>
  );
}

function formatFecha(date: Date) {
  const texto = date.toLocaleDateString("es-EC", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
