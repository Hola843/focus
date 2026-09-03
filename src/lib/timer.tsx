import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { TODAY } from "./core";
import { useStore } from "./store";
import { useToast } from "../components/ui";

export type TimerMode = "focus" | "break";

export interface ActiveSession {
  subjectId: string;
  title: string;
  planId?: string;
  blockMinutes: number;
  cycles: number;
  logged: number;
}

interface TimerValue {
  active: ActiveSession | null;
  mode: TimerMode;
  running: boolean;
  remaining: number;
  blockElapsed: number;
  loggedNow: number;
  start: (opts: { subjectId: string; title: string; minutes: number; planId?: string }) => void;
  toggle: () => void;
  stop: () => void;
  cancel: () => void;
}

const Ctx = createContext<TimerValue | null>(null);

export function TimerProvider({ children }: { children: ReactNode }) {
  const { settings, subjects, addSession, setPlanDone } = useStore();
  const toast = useToast();

  const [active, setActive] = useState<ActiveSession | null>(null);
  const [mode, setMode] = useState<TimerMode>("focus");
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(settings.focus * 60);
  const [blockElapsed, setBlockElapsed] = useState(0);

  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? "Estudio";

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
      setBlockElapsed((e) => e + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  // fin de bloque
  useEffect(() => {
    if (!active || !running || remaining > 0) return;

    if (mode === "focus") {
      addSession({
        date: TODAY,
        subjectId: active.subjectId,
        minutes: active.blockMinutes,
        type: "pomodoro",
        note: active.title,
      });
      if (active.planId) setPlanDone(active.planId, true);
      const cycles = active.cycles + 1;
      const isLong = cycles % settings.pomodorosLong === 0;
      setActive({
        ...active,
        cycles,
        planId: undefined,
        logged: active.logged + active.blockMinutes,
      });
      setBlockElapsed(0);
      setMode("break");
      setRemaining((isLong ? settings.long : settings.short) * 60);
      toast({
        title: `Bloque ${cycles} completado`,
        desc: `${active.blockMinutes} min en ${subjectName(active.subjectId)} · ahora toca descanso`,
        tone: "ok",
      });
    } else {
      setMode("focus");
      setBlockElapsed(0);
      setRemaining(settings.focus * 60);
      toast({ title: "Descanso terminado", desc: "Vuelta al foco.", tone: "info" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, running, mode, active]);

  const start = ({ subjectId, title, minutes, planId }: { subjectId: string; title: string; minutes: number; planId?: string }) => {
    setActive({ subjectId, title, planId, blockMinutes: minutes, cycles: 0, logged: 0 });
    setMode("focus");
    setBlockElapsed(0);
    setRemaining(minutes * 60);
    setRunning(true);
  };

  const stop = () => {
    if (!active) return;
    const partial = mode === "focus" ? Math.floor(blockElapsed / 60) : 0;
    if (partial >= 1) {
      addSession({
        date: TODAY,
        subjectId: active.subjectId,
        minutes: partial,
        type: "libre",
        note: `${active.title} (parcial)`,
      });
    }
    const total = active.logged + partial;
    if (active.planId) setPlanDone(active.planId, true);
    toast({
      title: total > 0 ? "Sesión terminada" : "Sesión cerrada",
      desc: total > 0 ? `${total} min registrados en ${subjectName(active.subjectId)}` : "No se ha registrado tiempo.",
      tone: total > 0 ? "ok" : "info",
    });
    setActive(null);
    setRunning(false);
    setMode("focus");
    setBlockElapsed(0);
    setRemaining(settings.focus * 60);
  };

  const cancel = () => {
    setActive(null);
    setRunning(false);
    setMode("focus");
    setBlockElapsed(0);
    setRemaining(settings.focus * 60);
    toast({ title: "Sesión descartada", desc: "No se ha registrado nada.", tone: "info" });
  };

  const value = useMemo<TimerValue>(
    () => ({
      active,
      mode,
      running,
      remaining,
      blockElapsed,
      loggedNow: (active?.logged ?? 0) + (mode === "focus" ? Math.floor(blockElapsed / 60) : 0),
      start,
      toggle: () => setRunning((r) => !r),
      stop,
      cancel,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active, mode, running, remaining, blockElapsed, settings, subjects],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTimer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTimer fuera de TimerProvider");
  return ctx;
}
