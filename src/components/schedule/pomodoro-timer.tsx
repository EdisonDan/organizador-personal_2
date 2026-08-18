"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Coffee, BookOpen } from "lucide-react";
import { ProgressRing } from "@/components/habits/progress-ring";
import { logPomodoroSession } from "@/app/(dashboard)/schedule/actions";
import type { Subject, Goal } from "@/lib/types";
import { cn } from "@/lib/utils";

function playChime() {
  try {
    type WebkitWindow = typeof window & { webkitAudioContext?: typeof AudioContext };
    const Ctx = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // navegadores que bloquean audio sin interacción previa: se ignora
  }
}

export function PomodoroTimer({
  subjects,
  goals = [],
  initialGoalId = "",
  initialTodayCount,
  initialBySubject,
}: {
  subjects: Subject[];
  goals?: Goal[];
  initialGoalId?: string;
  initialTodayCount: number;
  initialBySubject: { subjectId: string | null; subjectName: string; count: number }[];
}) {
  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [phase, setPhase] = useState<"work" | "break">("work");
  const [secondsLeft, setSecondsLeft] = useState(workMin * 60);
  const [running, setRunning] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [goalId, setGoalId] = useState(initialGoalId);
  const [todayCount, setTodayCount] = useState(initialTodayCount);
  const [bySubject, setBySubject] = useState(initialBySubject);

  const startedAtRef = useRef<string | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Este efecto reacciona a que el conteo llegue a 0 (un reloj externo vía
  // setInterval), no a un cálculo derivable en el render: por diseño dispara
  // varios setState para pasar de fase (enfoque -> descanso -> enfoque).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (secondsLeft > 0) return;
    playChime();

    if (phase === "work") {
      const subject = subjects.find((s) => s.id === subjectId);
      logPomodoroSession({
        subject_id: subjectId || null,
        goal_id: goalId || null,
        schedule_block_id: null,
        started_at: startedAtRef.current ?? new Date().toISOString(),
        duration_minutes: workMin,
      }).catch(() => {});

      setTodayCount((c) => c + 1);
      setBySubject((prev) => {
        const key = subjectId || null;
        const existing = prev.find((p) => p.subjectId === key);
        if (existing) {
          return prev.map((p) => (p.subjectId === key ? { ...p, count: p.count + 1 } : p));
        }
        return [...prev, { subjectId: key, subjectName: subject?.name ?? "Sin materia", count: 1 }];
      });

      setPhase("break");
      setSecondsLeft(breakMin * 60);
    } else {
      setPhase("work");
      setSecondsLeft(workMin * 60);
      // Si sigue corriendo, el siguiente bloque de enfoque arranca ahora mismo.
      startedAtRef.current = running ? new Date().toISOString() : null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function toggleRunning() {
    if (!running && phase === "work" && !startedAtRef.current) {
      startedAtRef.current = new Date().toISOString();
    }
    setRunning((r) => !r);
  }

  function reset() {
    setRunning(false);
    setPhase("work");
    setSecondsLeft(workMin * 60);
    startedAtRef.current = null;
  }

  function updateWorkMin(v: number) {
    setWorkMin(v);
    if (!running && phase === "work") setSecondsLeft(v * 60);
  }

  function updateBreakMin(v: number) {
    setBreakMin(v);
    if (!running && phase === "break") setSecondsLeft(v * 60);
  }

  const total = (phase === "work" ? workMin : breakMin) * 60;
  const percent = total === 0 ? 0 : Math.round((secondsLeft / total) * 100);
  const mm = String(Math.max(Math.floor(secondsLeft / 60), 0)).padStart(2, "0");
  const ss = String(Math.max(secondsLeft % 60, 0)).padStart(2, "0");

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 text-sm font-semibold text-foreground">Pomodoro</h2>

      <div className="flex flex-col items-center gap-3">
        <ProgressRing percent={percent} size={140} strokeWidth={8}>
          <div className="flex flex-col items-center">
            <span className="tabular-stat text-2xl font-semibold text-foreground">
              {mm}:{ss}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {phase === "work" ? <BookOpen className="h-3 w-3" /> : <Coffee className="h-3 w-3" />}
              {phase === "work" ? "Enfoque" : "Descanso"}
            </span>
          </div>
        </ProgressRing>

        <div className="flex gap-2">
          <button type="button" onClick={toggleRunning} className="btn-primary">
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {running ? "Pausar" : "Iniciar"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
            aria-label="Reiniciar"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {!running && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <label className="flex items-center gap-1">
              Enfoque
              <input
                type="number"
                min={5}
                max={90}
                value={workMin}
                onChange={(e) => updateWorkMin(Number(e.target.value))}
                className="input w-14 px-1.5 py-1 text-center"
              />
              min
            </label>
            <label className="flex items-center gap-1">
              Descanso
              <input
                type="number"
                min={1}
                max={30}
                value={breakMin}
                onChange={(e) => updateBreakMin(Number(e.target.value))}
                className="input w-14 px-1.5 py-1 text-center"
              />
              min
            </label>
          </div>
        )}

        {subjects.length > 0 && (
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            disabled={running}
            className="input w-full max-w-xs text-center text-sm disabled:opacity-60"
          >
            <option value="">Sin materia</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        {goals.length > 0 && (
          <select
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            disabled={running}
            className="input w-full max-w-xs text-center text-sm disabled:opacity-60"
          >
            <option value="">Sin objetivo</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <p className="mb-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Pomodoros hoy</span>
          <span className="tabular-stat font-semibold text-foreground">{todayCount}</span>
        </p>
        {bySubject.length > 0 && (
          <ul className="space-y-1">
            {bySubject.map((s) => (
              <li key={s.subjectId ?? "none"} className="flex items-center justify-between text-xs">
                <span className={cn("truncate text-muted-foreground")}>{s.subjectName}</span>
                <span className="tabular-stat text-foreground">{s.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
