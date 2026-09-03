import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  CalendarCheck,
  ChevronRight,
  HeartHandshake,
  ListTodo,
  NotebookPen,
  RotateCcw,
  Sun,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";
import { TODAY, fmtMinutes, longDate } from "../lib/core";
import { useStore } from "../lib/store";
import { useTodos } from "../lib/todos";
import { useUI, type View } from "../lib/ui-state";
import { cn } from "../utils/cn";
import { Bar, Button, Modal, useToast } from "./ui";

const NAV: { id: View; label: string; icon: typeof Sun; hint: string }[] = [
  { id: "hoy", label: "Hoy", icon: Sun, hint: "Rutina del día" },
  { id: "habitos", label: "Hábitos", icon: CalendarCheck, hint: "Constancia y rachas" },
  { id: "estudio", label: "Estudio", icon: BookOpen, hint: "Materias y sesiones" },
  { id: "tareas", label: "Tareas", icon: ListTodo, hint: "Tablero de pendientes" },
  { id: "diario", label: "Diario", icon: NotebookPen, hint: "Ánimo y reflexión" },
  { id: "progreso", label: "Progreso", icon: TrendingUp, hint: "Métricas y logros" },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gold-400 text-ink-950">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
          <path d="M4 19c3.5 0 4.5-14 8-14s4.5 14 8 14" />
          <circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="block font-display text-[19px] font-bold tracking-tight text-mist-50">Estela</span>
        <span className="block text-[10.5px] tracking-[0.16em] text-mist-500 uppercase">Hábitos · Estudio</span>
      </span>
    </div>
  );
}

function SidebarContent() {
  const { view, setView, openSession, openGratitude, unlocked, resetRitual } = useUI();
  const { habits, todayMinutes, todayDone, settings, gratitudeStreak, reset } = useStore();
  const { clearAll } = useTodos();
  const toast = useToast();
  const [resetOpen, setResetOpen] = useState(false);

  const wipe = (mode: "blank" | "demo") => {
    reset(mode);
    clearAll();
    try {
      localStorage.removeItem("estela.hero.v1");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent("estela:reset"));
    resetRitual();
    setResetOpen(false);
    toast({
      title: mode === "blank" ? "Todo a cero" : "Datos de ejemplo cargados",
      desc:
        mode === "blank"
          ? "Empieza por el ritual de gratitud y crea tus materias."
          : "Se ha recargado el dataset de demostración.",
      tone: mode === "blank" ? "warn" : "info",
    });
  };
  const goal = settings.dailyMinutes;

  return (
    <div className="flex h-full flex-col gap-6 p-5">
      <Logo />

      <nav className="flex flex-col gap-1">
        <p className="mb-1 px-2 text-[10.5px] font-semibold tracking-[0.18em] text-mist-500 uppercase">Tu práctica</p>
        {NAV.map((item) => {
          const active = view === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={cn(
                "group relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200",
                active ? "bg-white/[0.07] text-mist-50" : "text-mist-400 hover:bg-white/[0.04] hover:text-mist-200",
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute top-1/2 left-0 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gold-400"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Icon
                className={cn(
                  "h-[18px] w-[18px] transition-colors",
                  active ? "text-gold-400" : "text-mist-500 group-hover:text-mist-300",
                )}
              />
              <span className="flex-1">
                <span className="block text-[13.5px] font-medium">{item.label}</span>
                <span className="block text-[11px] text-mist-500">{item.hint}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <button
        onClick={openSession}
        className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gold-400 text-[13.5px] font-semibold text-ink-950 shadow-[0_10px_30px_-12px_rgba(242,169,59,0.85)] transition-all hover:bg-gold-300 active:scale-[0.97]"
      >
        <BookOpen className="h-4 w-4" />
        Registrar sesión
      </button>

      <div className="mt-auto space-y-3">
        <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.06] to-transparent p-4">
          <p className="text-[10.5px] tracking-[0.12em] text-mist-500 uppercase">{longDate(TODAY)}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="num text-[24px] font-bold text-mist-50">{fmtMinutes(todayMinutes)}</span>
            <span className="text-[11.5px] text-mist-500">/ {fmtMinutes(goal)}</span>
          </div>
          <Bar value={goal ? todayMinutes / goal : 0} color="#37c7b0" className="mt-2" />
            <p className="mt-2 text-[11.5px] text-mist-400">
              <span className="text-gold-400">{todayDone}</span> de {habits.length} hábitos marcados hoy
            </p>
        </div>

        <button
          onClick={openGratitude}
          className="group flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-3 text-left transition-all duration-200 hover:border-rose-400/40 hover:bg-rose-400/[0.12]"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-400/15 text-rose-400 transition-transform duration-200 group-hover:scale-110">
            <HeartHandshake className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-mist-100">
              <span
                className={cn("h-1.5 w-1.5 shrink-0 rounded-full", unlocked ? "bg-teal-400" : "bg-gold-400 pulse-ring")}
              />
              Ritual de gratitud
            </span>
            <span className="block truncate text-[11px] text-mist-500">
              {unlocked
                ? `Hecho · racha de ${gratitudeStreak || 1}`
                : "Pendiente · escribe tus tres cosas"}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-mist-600 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>

        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-ink-900/60 p-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-peri-400 to-teal-400 text-[13px] font-bold text-ink-950">
            J
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[13px] font-medium text-mist-100">Jefe</span>
            <span className="block text-[11px] text-mist-500">Plan autónomo</span>
          </span>
          <button
            aria-label="Empezar de cero"
            title="Empezar de cero"
            onClick={() => setResetOpen(true)}
            className="cursor-pointer rounded-lg p-1.5 text-mist-500 transition-colors hover:bg-white/[0.06] hover:text-mist-200"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Empezar de cero"
        subtitle="Se borra todo lo guardado en este navegador"
        width="max-w-md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              Cancelar
            </Button>
            <Button variant="soft" onClick={() => wipe("demo")}>
              Cargar ejemplo
            </Button>
            <Button variant="danger" onClick={() => wipe("blank")}>
              <RotateCcw className="h-4 w-4" />
              Borrar todo
            </Button>
          </>
        }
      >
        <ul className="space-y-2 text-[13px] text-mist-300">
          {[
            "Hábitos y sus marcas diarias",
            "Materias, sesiones y temporizador",
            "Exámenes y notas registradas",
            "Tareas, agenda y lista rápida",
            "Notas del diario y agradecimientos",
            "Foto del templo",
          ].map((line) => (
            <li key={line} className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-ink-900/50 px-3 py-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-coral-400" />
              {line}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] leading-relaxed text-mist-500">
          Después de borrar, la app volverá a pedirte el ritual de gratitud para empezar limpio. Si solo quieres ver
          cómo queda rellena, usa «Cargar ejemplo».
        </p>
      </Modal>
    </div>
  );
}

export function Sidebar() {
  const { drawer, setDrawer } = useUI();

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[258px] shrink-0 border-r border-white/[0.06] bg-ink-950/80 lg:block">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-ink-950/75 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="relative h-full w-[280px] border-r border-white/[0.08] bg-ink-900"
            >
              <button
                aria-label="Cerrar menú"
                onClick={() => setDrawer(false)}
                className="absolute top-5 right-4 z-10 cursor-pointer rounded-lg p-2 text-mist-400 hover:bg-white/[0.06]"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
