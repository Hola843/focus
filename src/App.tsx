import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, CalendarCheck, ListTodo, NotebookPen, Plus, Sun, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { GratitudeGate } from "./components/GratitudeGate";
import { SessionModal } from "./components/SessionModal";
import { Sidebar } from "./components/Sidebar";
import { Starfield } from "./components/Starfield";
import { SubjectModal } from "./components/SubjectModal";
import { Topbar } from "./components/Topbar";
import { ToastHost } from "./components/ui";
import { StoreProvider, useStore } from "./lib/store";
import { TimerProvider } from "./lib/timer";
import { TodoProvider } from "./lib/todos";
import { UIProvider, useUI, type View } from "./lib/ui-state";
import { Habits } from "./pages/Habits";
import { Journal } from "./pages/Journal";
import { Progress } from "./pages/Progress";
import { Study } from "./pages/Study";
import { Tasks } from "./pages/Tasks";
import { Today } from "./pages/Today";
import { cn } from "./utils/cn";

const NAV: { id: View; label: string; icon: typeof Sun }[] = [
  { id: "hoy", label: "Hoy", icon: Sun },
  { id: "habitos", label: "Hábitos", icon: CalendarCheck },
  { id: "estudio", label: "Estudio", icon: BookOpen },
  { id: "tareas", label: "Tareas", icon: ListTodo },
  { id: "diario", label: "Diario", icon: NotebookPen },
  { id: "progreso", label: "Progreso", icon: TrendingUp },
];

function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-900">
      <div className="animate-drift absolute -top-44 -left-32 h-[520px] w-[520px] rounded-full bg-gold-400/12 blur-[130px]" />
      <div className="animate-drift-slow absolute top-1/3 -right-40 h-[560px] w-[560px] rounded-full bg-peri-400/10 blur-[140px]" />
      <div className="animate-drift absolute -bottom-52 left-1/3 h-[460px] w-[460px] rounded-full bg-teal-400/10 blur-[130px]" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)",
          backgroundSize: "58px 58px",
          maskImage: "radial-gradient(ellipse at 50% 0%, black 25%, transparent 78%)",
        }}
      />
      <Starfield />
      <div className="grain absolute inset-0 opacity-[0.03]" />
    </div>
  );
}

function BottomNav() {
  const { view, setView } = useUI();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-ink-950/95 backdrop-blur-xl lg:hidden">
      <div className="flex items-stretch">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = view === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={cn(
                "relative flex flex-1 cursor-pointer flex-col items-center gap-1 py-2.5 text-[10px] transition-colors",
                active ? "text-gold-400" : "text-mist-500",
              )}
            >
              {active && <motion.span layoutId="tab-active" className="absolute top-0 h-[2px] w-7 rounded-full bg-gold-400" />}
              <Icon className="h-[18px] w-[18px]" />
              {n.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function MobileFab() {
  const { openSession } = useUI();
  return (
    <button
      onClick={openSession}
      aria-label="Registrar sesión"
      className="fixed right-4 bottom-[74px] z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl bg-gold-400 text-ink-950 shadow-[0_16px_40px_-12px_rgba(242,169,59,0.9)] transition-transform duration-200 hover:bg-gold-300 active:scale-95 lg:hidden"
    >
      <Plus className="h-6 w-6" />
    </button>
  );
}

function Shell() {
  const { view, openSession } = useUI();
  const { sessions } = useStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        openSession();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSession]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  return (
    <div className="relative flex min-h-screen">
      <Background />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 pt-5 pb-28 sm:px-6 lg:pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {view === "hoy" && <Today />}
              {view === "habitos" && <Habits />}
              {view === "estudio" && <Study />}
              {view === "tareas" && <Tasks />}
              {view === "diario" && <Journal />}
              {view === "progreso" && <Progress />}
            </motion.div>
          </AnimatePresence>

          <footer className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.06] pt-5 text-[11.5px] text-mist-500">
            <span className="font-display text-[13px] font-semibold text-mist-400">Estela</span>
            <span>
              {sessions.length} sesiones registradas · todo se guarda en tu navegador
            </span>
            <span className="ml-auto hidden items-center gap-2 sm:flex">
              <kbd className="rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5">S</kbd> registrar sesión
              <kbd className="ml-2 rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5">/</kbd> buscar
            </span>
          </footer>
        </main>
      </div>
      <MobileFab />
      <BottomNav />
      <SessionModal />
      <SubjectModal />
      <GratitudeGate />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <ToastHost>
        <TodoProvider>
          <TimerProvider>
            <UIProvider>
              <Shell />
            </UIProvider>
          </TimerProvider>
        </TodoProvider>
      </ToastHost>
    </StoreProvider>
  );
}
