import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type View = "hoy" | "habitos" | "estudio" | "tareas" | "diario" | "progreso";

const KEY = "estela.gratitude.last";
const WINDOW_MS = 24 * 60 * 60 * 1000;

function readLast(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function writeLast(value: string | null) {
  try {
    if (value) localStorage.setItem(KEY, value);
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** El ritual se pide como mucho una vez cada 24 h. */
function isFresh(last: string | null): boolean {
  if (!last) return false;
  const t = Date.parse(last);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < WINDOW_MS;
}

export function gratitudeDue(last: string | null): Date | null {
  if (!last) return null;
  const t = Date.parse(last);
  if (Number.isNaN(t)) return null;
  return new Date(t + WINDOW_MS);
}

export function dueLabel(last: string | null): string {
  const due = gratitudeDue(last);
  if (!due) return "Pendiente hoy";
  const sameDay = due.toDateString() === new Date().toDateString();
  const time = due.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return sameDay
    ? `Volverá a las ${time}`
    : `Volverá ${due.toLocaleDateString("es-ES", { weekday: "long" })} a las ${time}`;
}

interface UIState {
  view: View;
  setView: (v: View) => void;
  drawer: boolean;
  setDrawer: (v: boolean) => void;
  sessionModal: boolean;
  openSession: () => void;
  closeSession: () => void;
  journalModal: boolean;
  openJournal: () => void;
  closeJournal: () => void;
  subjectModal: boolean;
  openSubjects: () => void;
  closeSubjects: () => void;
  /** El ritual bloquea la app solo si no se ha hecho en las últimas 24 h. */
  unlocked: boolean;
  unlock: () => void;
  resetRitual: () => void;
  lastGratitude: string | null;
  gratitudeOpen: boolean;
  openGratitude: () => void;
  closeGratitude: () => void;
}

const Ctx = createContext<UIState | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [view, setViewRaw] = useState<View>("hoy");
  const [drawer, setDrawer] = useState(false);
  const [sessionModal, setSessionModal] = useState(false);
  const [journalModal, setJournalModal] = useState(false);
  const [subjectModal, setSubjectModal] = useState(false);
  const [gratitudeOpen, setGratitudeOpen] = useState(false);
  const [lastGratitude, setLastGratitude] = useState<string | null>(() => readLast());
  const [unlocked, setUnlocked] = useState<boolean>(() => isFresh(readLast()));

  useEffect(() => {
    const id = window.setInterval(() => setLastGratitude((prev) => prev), 60000);
    return () => window.clearInterval(id);
  }, []);

  const value = useMemo<UIState>(
    () => ({
      view,
      setView: (v) => {
        setViewRaw(v);
        setDrawer(false);
      },
      drawer,
      setDrawer,
      sessionModal,
      openSession: () => setSessionModal(true),
      closeSession: () => setSessionModal(false),
      journalModal,
      openJournal: () => setJournalModal(true),
      closeJournal: () => setJournalModal(false),
      subjectModal,
      openSubjects: () => setSubjectModal(true),
      closeSubjects: () => setSubjectModal(false),
      unlocked,
      unlock: () => {
        const stamp = new Date().toISOString();
        setLastGratitude(stamp);
        writeLast(stamp);
        setUnlocked(true);
      },
      resetRitual: () => {
        writeLast(null);
        setLastGratitude(null);
        setUnlocked(false);
      },
      lastGratitude,
      gratitudeOpen,
      openGratitude: () => setGratitudeOpen(true),
      closeGratitude: () => setGratitudeOpen(false),
    }),
    [view, drawer, sessionModal, journalModal, subjectModal, unlocked, gratitudeOpen, lastGratitude],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUI() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUI fuera de UIProvider");
  return ctx;
}
