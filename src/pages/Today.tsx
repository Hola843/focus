import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Flame,
  GraduationCap,
  ListTodo,
  NotebookPen,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo } from "react";
import { Hero } from "../components/Hero";
import { DayBars } from "../components/charts";
import { SessionTimer } from "../components/SessionTimer";
import { TodoList } from "../components/TodoList";
import { Bar, Button, EmptyState, Panel, PanelHead, Ring, useToast } from "../components/ui";
import {
  TODAY,
  addDays,
  daysUntil,
  fmtHours,
  fmtMinutes,
  greeting,
  habitIcon,
  longDate,
  relativeDay,
  shortDate,
  subjectIcon,
  weekday,
} from "../lib/core";
import { useStore } from "../lib/store";
import { useUI } from "../lib/ui-state";
import { cn } from "../utils/cn";

const stagger = { show: { transition: { staggerChildren: 0.06 } } };
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

const PRIORITY_ORDER = { alta: 0, media: 1, baja: 2 };
const PRIORITY_COLOR = { alta: "#ff7a6b", media: "#f2a93b", baja: "#7c93ff" };

export function Today() {
  const { habits, logs, subjects, sessions, tasks, entries, exams, settings, todayMinutes, todayDone, streaks, toggleHabit, moveTask, deleteSession, last7 } =
    useStore();
  const { setView, openSession, openJournal } = useUI();
  const toast = useToast();

  const studyGoal = settings.dailyMinutes;
  const dayProgress =
    habits.length > 0 ? (todayDone / habits.length + Math.min(1, studyGoal ? todayMinutes / studyGoal : 0)) / 2 : 0;

  const pending = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== "hecha" && t.due <= TODAY)
        .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || (a.due < b.due ? -1 : 1))
        .slice(0, 5),
    [tasks],
  );

  const todaySessions = useMemo(
    () => sessions.filter((s) => s.date === TODAY).sort((a, b) => b.minutes - a.minutes),
    [sessions],
  );

  const lastEntry = entries[0];
  const bestStreakToday = Math.max(0, ...habits.map((h) => streaks[h.id] ?? 0));
  const focusTask = pending[0];

  const markAll = () => {
    habits.forEach((h) => {
      if (!(logs[h.id] ?? []).includes(TODAY)) toggleHabit(h.id, TODAY);
    });
    toast({ title: "Día cerrado", desc: "Todos los hábitos marcados. Imparable.", tone: "ok" });
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      {/* ---------------------------------- hero ----------------------------------- */}
      <motion.div variants={item} className="xl:col-span-12">
        <Hero />
      </motion.div>

      {/* ------------------------------ portada del día ----------------------------- */}
      <motion.div variants={item} className="xl:col-span-8">
        <Panel glow="#f2a93b" className="h-full p-6 sm:p-7">
          <div className="flex flex-wrap items-start gap-8">
            <div className="min-w-[240px] flex-1">
              <p className="flex items-center gap-2 text-[11.5px] font-semibold tracking-[0.16em] text-mist-500 uppercase">
                <span className="pulse-ring h-1.5 w-1.5 rounded-full bg-gold-400" />
                {longDate(TODAY)}
              </p>
              <h2 className="font-display mt-3 text-[34px] leading-[1.05] font-bold tracking-tight text-mist-50 sm:text-[42px]">
                {greeting()}, jefe.
                <span className="block text-mist-300">Hoy toca avanzar un 1 %.</span>
              </h2>
              <p className="mt-4 max-w-md text-[13.5px] leading-relaxed text-mist-400">
                {focusTask ? (
                  <>
                    Tu foco prioritario es{" "}
                    <strong className="text-mist-100">{focusTask.title}</strong>
                    {focusTask.due < TODAY ? " (va con retraso)" : focusTask.due === TODAY ? " para hoy" : ` (${relativeDay(focusTask.due)})`}.
                  </>
                ) : (
                  "No hay tareas urgentes: buen momento para adelantar lectura o repasar."
                )}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="primary" onClick={openSession}>
                  Registrar sesión
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="soft" onClick={markAll} disabled={todayDone === habits.length}>
                  <Check className="h-4 w-4" />
                  Marcar todos los hábitos
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <Ring value={dayProgress} size={148} stroke={12} color="#f2a93b">
                <span className="num text-[28px] leading-none font-bold text-mist-50">{Math.round(dayProgress * 100)}</span>
                <span className="text-[10.5px] tracking-[0.12em] text-mist-500 uppercase">del día</span>
              </Ring>
              <div className="space-y-3">
                <MiniStat label="Estudio hoy" value={fmtMinutes(todayMinutes)} sub={`meta ${fmtMinutes(studyGoal)}`} />
                <MiniStat label="Hábitos" value={`${todayDone}/${habits.length}`} sub="marcados hoy" />
                <MiniStat label="Mejor racha" value={`${bestStreakToday} d`} sub="ahora mismo" accent />
              </div>
            </div>
          </div>
        </Panel>
      </motion.div>

      {/* --------------------------- temporizador de sesión ------------------------ */}
      <motion.div variants={item} className="xl:col-span-4">
        <SessionTimer />
      </motion.div>

      {/* ------------------------------ hábitos de hoy ----------------------------- */}
      <motion.div variants={item} className="xl:col-span-7">
        <Panel glow="#f06ba8">
          <PanelHead
            title="Hábitos de hoy"
            hint={`${todayDone} de ${habits.length} completados`}
            action={
              <button
                onClick={() => setView("habitos")}
                className="cursor-pointer text-[12px] text-gold-400 transition-colors hover:text-gold-300"
              >
                Gestionar
              </button>
            }
          />
          <ul className="divide-y divide-white/[0.05]">
            {habits.map((h) => {
              const done = (logs[h.id] ?? []).includes(TODAY);
              const Icon = habitIcon(h.icon);
              const streak = streaks[h.id] ?? 0;
              return (
                <li key={h.id}>
                  <button
                    onClick={() => {
                      toggleHabit(h.id, TODAY);
                      if (!done && todayDone + 1 === habits.length)
                        toast({ title: "¡Día completo!", desc: "Todos tus hábitos marcados.", tone: "ok" });
                    }}
                    className="group flex w-full cursor-pointer items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-white/[0.035]"
                  >
                    <motion.span
                      animate={done ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                      transition={{ duration: 0.35 }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-200"
                      style={{
                        background: done ? h.color : `${h.color}14`,
                        color: done ? "#0b0910" : h.color,
                      }}
                    >
                      {done ? <Check className="h-4 w-4" strokeWidth={3} /> : <Icon className="h-4 w-4" />}
                    </motion.span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-[13.5px] font-medium", done ? "text-mist-500 line-through" : "text-mist-100")}>
                        {h.name}
                      </span>
                      <span className="block truncate text-[11.5px] text-mist-500">{h.note}</span>
                    </span>
                    {streak > 0 && (
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-opacity",
                          done ? "border-gold-400/30 bg-gold-400/10 text-gold-300" : "border-white/[0.08] text-mist-500",
                        )}
                      >
                        <Flame className="h-3 w-3" />
                        {streak}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
            {habits.length === 0 && (
              <li>
                <EmptyState
                  icon={<Sparkles className="h-5 w-5" />}
                  title="Sin hábitos"
                  desc="Crea tu primer hábito en la sección Hábitos."
                />
              </li>
            )}
          </ul>
        </Panel>
      </motion.div>

      {/* ------------------------------- tareas de hoy ----------------------------- */}
      <motion.div variants={item} className="xl:col-span-5">
        <Panel glow="#7c93ff" className="h-full">
          <PanelHead
            title="En el punto de mira"
            hint="Vencidas y para hoy"
            action={
              <button
                onClick={() => setView("tareas")}
                className="cursor-pointer text-[12px] text-gold-400 transition-colors hover:text-gold-300"
              >
                Ver tablero
              </button>
            }
          />
          {pending.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Nada urgente"
              desc="No hay tareas vencidas ni para hoy. Disfruta el respiro."
            />
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {pending.map((t) => {
                const subject = subjects.find((s) => s.id === t.subjectId);
                const late = t.due < TODAY;
                return (
                  <li key={t.id} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.035]">
                    <button
                      onClick={() => {
                        moveTask(t.id, "hecha");
                        toast({ title: "Tarea completada", desc: t.title, tone: "ok" });
                      }}
                      aria-label={`Completar ${t.title}`}
                      className="cursor-pointer text-mist-500 transition-colors hover:text-teal-400"
                    >
                      <Circle className="h-5 w-5" />
                    </button>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-mist-100">{t.title}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-[11.5px] text-mist-500">
                        <span className="h-2 w-2 rounded-full" style={{ background: subject?.color ?? "#8b7fa5" }} />
                        {subject?.name ?? "General"}
                        <span className={cn("num", late && "text-coral-400")}>{relativeDay(t.due)}</span>
                      </span>
                    </span>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                      style={{ background: `${PRIORITY_COLOR[t.priority]}1f`, color: PRIORITY_COLOR[t.priority] }}
                    >
                      {t.priority}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </motion.div>

      {/* -------------------------------- lista rápida ----------------------------- */}
      <motion.div variants={item} className="xl:col-span-12">
        <TodoList
          title="Pequeñas cosas de hoy"
          hint="Recados, gestos y detalles que no merecen una tarea entera"
        />
      </motion.div>

      {/* ------------------------------- últimos 7 días ---------------------------- */}
      <motion.div variants={item} className="xl:col-span-8">
        <Panel>
          <PanelHead
            title="Últimos 7 días de estudio"
            hint={`${fmtHours(last7.reduce((s, d) => s + d.minutes, 0))} esta semana · meta diaria ${fmtMinutes(studyGoal)}`}
            action={
              <span className="hidden items-center gap-3 text-[11.5px] text-mist-400 sm:flex">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-gold-400" /> por debajo
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-teal-400" /> meta cumplida
                </span>
              </span>
            }
          />
          <div className="h-[236px] px-3 pt-4 pb-2">
            <DayBars
              labels={last7.map((d) => weekday(d.date).slice(0, 3))}
              minutes={last7.map((d) => d.minutes)}
              target={studyGoal}
            />
          </div>
        </Panel>
      </motion.div>

      {/* ------------------------------- notas del diario --------------------------- */}
      <motion.div variants={item} className="xl:col-span-4">
        <Panel glow="#f06ba8" className="flex h-full flex-col">
          <PanelHead
            title="Notas del diario"
            hint={lastEntry ? `Última: ${shortDate(lastEntry.date)}` : "Sin notas todavía"}
            action={
              <button
                onClick={() => {
                  setView("diario");
                  openJournal();
                }}
                className="cursor-pointer text-[12px] text-gold-400 transition-colors hover:text-gold-300"
              >
                Escribir
              </button>
            }
          />
          {entries.length === 0 ? (
            <EmptyState
              icon={<NotebookPen className="h-5 w-5" />}
              title="Sin notas todavía"
              desc="Dos líneas al final del día y el diario empieza a trabajar para ti."
              action={
                <Button
                  variant="soft"
                  size="sm"
                  onClick={() => {
                    setView("diario");
                    openJournal();
                  }}
                >
                  Escribir la primera
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {entries.slice(0, 3).map((e) => (
                <li key={e.id} className="group px-5 py-3.5 transition-colors hover:bg-white/[0.03]">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-[11px] tracking-[0.1em] text-mist-500 uppercase">
                      <NotebookPen className="h-3 w-3 text-rose-400" />
                      {relativeDay(e.date)}
                    </p>
                    <button
                      onClick={() => setView("diario")}
                      className="cursor-pointer text-[11px] text-mist-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-gold-400"
                    >
                      abrir
                    </button>
                  </div>
                  <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-mist-200">{e.text}</p>
                  {e.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {e.tags.map((t) => (
                        <span key={t} className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-mist-500">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </motion.div>

      {/* ------------------------------- agenda próxima ---------------------------- */}
      <motion.div variants={item} className="xl:col-span-12">
        <Panel glow="#7c93ff">
          <PanelHead
            title="Próximos exámenes"
            hint="Cuenta atrás desde hoy"
            action={
              <button
                onClick={() => setView("estudio")}
                className="cursor-pointer text-[12px] text-gold-400 transition-colors hover:text-gold-300"
              >
                Abrir calendario
              </button>
            }
          />
          {exams.filter((e) => e.date >= TODAY).length === 0 ? (
            <p className="px-5 py-6 text-[13px] text-mist-500">Sin exámenes a la vista. Buen momento para adelantar.</p>
          ) : (
            <ul className="grid gap-px bg-white/[0.04] sm:grid-cols-2 xl:grid-cols-3">
              {exams
                .filter((e) => e.date >= TODAY)
                .slice(0, 3)
                .map((e) => {
                  const s = subjects.find((x) => x.id === e.subjectId);
                  const left = daysUntil(e.date);
                  return (
                    <li key={e.id} className="flex items-center gap-3 bg-ink-850 px-5 py-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-coral-400/12 text-coral-400">
                        <GraduationCap className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-mist-100">{e.title}</span>
                        <span className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] text-mist-500">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: s?.color }} />
                          {s?.name} · {shortDate(e.date)} a las {e.time}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "num shrink-0 rounded-lg border px-2 py-1 text-[12px] font-semibold",
                          left <= 3 ? "border-coral-400/40 bg-coral-400/10 text-coral-400" : "border-white/[0.08] text-mist-300",
                        )}
                      >
                        {left === 0 ? "hoy" : `${left} d`}
                      </span>
                    </li>
                  );
                })}
            </ul>
          )}
        </Panel>
      </motion.div>

      {/* ------------------------------ sesiones de hoy ---------------------------- */}
      <motion.div variants={item} className="xl:col-span-12">
        <Panel>
          <PanelHead
            title="Sesiones de hoy"
            hint={todaySessions.length ? `${fmtMinutes(todayMinutes)} en ${todaySessions.length} bloque(s)` : "Aún no has registrado nada"}
            action={
              <button
                onClick={() => setView("estudio")}
                className="cursor-pointer text-[12px] text-gold-400 transition-colors hover:text-gold-300"
              >
                Ver estudio
              </button>
            }
          />
          {todaySessions.length === 0 ? (
            <div className="flex flex-wrap items-center gap-4 px-5 py-6">
              <ListTodo className="h-5 w-5 text-mist-500" />
              <p className="text-[13px] text-mist-500">
                Arranca un pomodoro o apunta una sesión manual para empezar a llenar tu estela de hoy.
              </p>
              <Button variant="soft" size="sm" className="ml-auto" onClick={openSession}>
                Registrar
              </Button>
            </div>
          ) : (
            <ul className="grid gap-px bg-white/[0.04] sm:grid-cols-2 lg:grid-cols-3">
              {todaySessions.map((s) => {
                const subject = subjects.find((x) => x.id === s.subjectId);
                const Icon = subjectIcon(subject?.icon ?? "BookOpen");
                return (
                  <li key={s.id} className="group flex items-center gap-3 bg-ink-850 px-5 py-3.5">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `${subject?.color ?? "#8b7fa5"}1a`, color: subject?.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-mist-100">{subject?.name ?? "Materia"}</span>
                      <span className="block truncate text-[11.5px] text-mist-500">{s.note}</span>
                    </span>
                    <span className="num shrink-0 text-[12.5px] text-mist-300">{fmtMinutes(s.minutes)}</span>
                    <button
                      onClick={() => deleteSession(s.id)}
                      aria-label="Eliminar sesión"
                      className="cursor-pointer text-mist-600 opacity-0 transition-all group-hover:opacity-100 hover:text-coral-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </motion.div>

      {/* ------------------------------ resumen semanal ---------------------------- */}
      <motion.div variants={item} className="xl:col-span-12">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[20px] border border-white/[0.07] bg-ink-850/60 p-5">
            <p className="text-[11px] tracking-[0.1em] text-mist-500 uppercase">Constancia 7 días</p>
            <div className="mt-3 flex items-center gap-3">
              <Bar
                value={habits.length ? habits.filter((h) => (logs[h.id] ?? []).includes(addDays(TODAY, -1))).length / habits.length : 0}
                color="#f06ba8"
                className="flex-1"
              />
              <span className="num text-[13px] text-mist-200">
                {habits.filter((h) => (logs[h.id] ?? []).includes(addDays(TODAY, -1))).length}/{habits.length}
              </span>
            </div>
            <p className="mt-2 text-[11.5px] text-mist-500">Hábitos cumplidos ayer</p>
          </div>
          <div className="rounded-[20px] border border-white/[0.07] bg-ink-850/60 p-5">
            <p className="text-[11px] tracking-[0.1em] text-mist-500 uppercase">Media diaria (7 d)</p>
            <p className="num mt-2 text-[22px] font-semibold text-mist-50">
              {fmtMinutes(last7.reduce((s, d) => s + d.minutes, 0) / 7)}
            </p>
            <p className="mt-1 text-[11.5px] text-mist-500">de estudio real al día</p>
          </div>
          <div className="rounded-[20px] border border-white/[0.07] bg-ink-850/60 p-5">
            <p className="text-[11px] tracking-[0.1em] text-mist-500 uppercase">Tareas activas</p>
            <p className="num mt-2 text-[22px] font-semibold text-mist-50">{tasks.filter((t) => t.status !== "hecha").length}</p>
            <p className="mt-1 text-[11.5px] text-mist-500">{tasks.filter((t) => t.status === "hecha").length} completadas</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}



function MiniStat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="min-w-[128px] rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
      <p className="text-[10.5px] tracking-[0.1em] text-mist-500 uppercase">{label}</p>
      <p className={cn("num mt-1 text-[18px] font-semibold", accent ? "text-gold-400" : "text-mist-50")}>{value}</p>
      <p className="text-[11px] text-mist-500">{sub}</p>
    </div>
  );
}
