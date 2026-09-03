import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GraduationCap,
  ListTodo,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  Timer,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  TODAY,
  WEEKDAYS,
  addDays,
  addMonthKey,
  countdown,
  daysUntil,
  fmtMinutes,
  monthGrid,
  monthKeyOf,
  monthTitle,
  relativeDay,
  shortDate,
  sortPlans,
  startOfWeek,
  subjectIcon,
  type Exam,
  type Plan,
} from "../lib/core";
import { useStore } from "../lib/store";
import { useUI } from "../lib/ui-state";
import { cn } from "../utils/cn";
import { Button, Chip, EmptyState, Field, IconBtn, Modal, Panel, PanelHead, Segmented, inputCls, useToast } from "./ui";

/* ============================== cuenta atrás ============================== */

export function ExamCountdown() {
  const { exams, subjects, upcomingPlans } = useStore();
  const next = exams.filter((e) => e.date >= TODAY)[0];
  const rest = exams.filter((e) => e.date >= TODAY).slice(1, 4);

  if (!next) {
    return (
      <Panel glow="#ff7a6b">
        <PanelHead title="Próximo examen" hint="Sin fechas a la vista" />
        <div className="p-5 text-[13px] text-mist-400">
          Añade tus exámenes para ver la cuenta atrás y organizar el repaso.
        </div>
      </Panel>
    );
  }

  const subject = subjects.find((s) => s.id === next.subjectId);
  const left = daysUntil(next.date);
  const prepWindow = 30;
  const elapsed = Math.max(0, Math.min(1, 1 - left / prepWindow));
  const planned = upcomingPlans.filter((p) => p.subjectId === next.subjectId && p.date <= next.date).length;

  return (
    <Panel glow="#ff7a6b" className="overflow-hidden">
      <div
        aria-hidden
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${subject?.color ?? "#ff7a6b"} var(--p), transparent var(--p))`, ["--p" as string]: `${elapsed * 100}%` }}
      />
      <PanelHead title="Próximo examen" hint={`${relativeDay(next.date)} · ${countdown(next.date)}`} />
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: `${subject?.color ?? "#ff7a6b"}1f`, color: subject?.color }}
          >
            <GraduationCap className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] leading-tight font-semibold text-mist-50">{next.title}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-mist-500">
              <span className="h-2 w-2 rounded-full" style={{ background: subject?.color }} />
              {subject?.name}
            </p>
          </div>
          <span className="num ml-auto shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[15px] font-semibold text-mist-50">
            {left === 0 ? "HOY" : `${left} d`}
          </span>
        </div>

        <div className="mt-4 space-y-1.5 text-[12px] text-mist-400">
          <p className="flex items-center gap-2">
            <Clock3 className="h-3.5 w-3.5 text-mist-500" />
            {next.time} · {shortDate(next.date)}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-mist-500" />
            {next.place || "Lugar por confirmar"}
          </p>
          <p className="flex items-center gap-2">
            <Timer className="h-3.5 w-3.5 text-mist-500" />
            {planned} {planned === 1 ? "sesión planificada" : "sesiones planificadas"} para {subject?.name}
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-white/[0.07] bg-ink-900/50 p-3">
          <div className="flex items-baseline justify-between text-[11px] text-mist-500">
            <span>Ventana de preparación (30 d)</span>
            <span className="num">{Math.round(elapsed * 100)} %</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
            <motion.div
              className="h-full rounded-full"
              style={{ background: left <= 3 ? "#ff7a6b" : "#f2a93b", boxShadow: "0 0 12px rgba(242,169,59,0.5)" }}
              initial={{ width: 0 }}
              animate={{ width: `${elapsed * 100}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        {rest.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-white/[0.06] pt-3">
            {rest.map((e) => {
              const s = subjects.find((x) => x.id === e.subjectId);
              return (
                <li key={e.id} className="flex items-center gap-2 text-[12px]">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s?.color }} />
                  <span className="min-w-0 flex-1 truncate text-mist-300">{e.title}</span>
                  <span className="num shrink-0 text-mist-500">{countdown(e.date)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Panel>
  );
}

/* ================================= agenda ================================= */

export function Agenda({ side }: { side?: ReactNode }) {
  const { plans, exams, tasks, sessions, subjects, settings, setPlanDone, deletePlan, deleteExam, moveTask } = useStore();
  const { openSubjects } = useUI();
  const toast = useToast();

  const [monthKey, setMonthKey] = useState(monthKeyOf(TODAY));
  const [selected, setSelected] = useState(TODAY);
  const [view, setView] = useState<"mes" | "semana">("mes");
  const [dir, setDir] = useState(0);
  const [planState, setPlanState] = useState<{ open: boolean; editing: Plan | null }>({ open: false, editing: null });
  const [examState, setExamState] = useState<{ open: boolean; editing: Exam | null }>({ open: false, editing: null });

  const cells = useMemo(() => {
    if (view === "mes") return monthGrid(monthKey);
    const start = startOfWeek(selected);
    return Array.from({ length: 7 }, (_, i) => ({ date: addDays(start, i), inMonth: true }));
  }, [view, monthKey, selected]);

  const minutesByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) map.set(s.date, (map.get(s.date) ?? 0) + s.minutes);
    return map;
  }, [sessions]);

  const byDate = useMemo(() => {
    const map = new Map<string, { plans: Plan[]; exams: Exam[]; tasks: typeof tasks }>();
    const get = (d: string) => {
      if (!map.has(d)) map.set(d, { plans: [], exams: [], tasks: [] });
      return map.get(d)!;
    };
    for (const p of plans) get(p.date).plans.push(p);
    for (const e of exams) get(e.date).exams.push(e);
    for (const t of tasks) get(t.due).tasks.push(t);
    for (const v of map.values()) v.plans.sort(sortPlans);
    return map;
  }, [plans, exams, tasks]);

  const dayData = (date: string) => byDate.get(date) ?? { plans: [], exams: [], tasks: [] };

  const monthPlans = plans.filter((p) => p.date.startsWith(monthKey));
  const monthExams = exams.filter((e) => e.date.startsWith(monthKey));
  const monthTasks = tasks.filter((t) => t.due.startsWith(monthKey));
  const monthMinutes = sessions.filter((s) => s.date.startsWith(monthKey)).reduce((a, s) => a + s.minutes, 0);

  const shift = (delta: number) => {
    setDir(delta);
    if (view === "mes") {
      setMonthKey(addMonthKey(monthKey, delta));
    } else {
      setSelected(addDays(selected, delta * 7));
    }
  };

  const goToday = () => {
    setDir(0);
    setMonthKey(monthKeyOf(TODAY));
    setSelected(TODAY);
  };

  const selectedDay = dayData(selected);
  const selectedMinutes = minutesByDate.get(selected) ?? 0;
  const legend = subjects.slice(0, 5);

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-12">
        {/* calendario */}
        <Panel glow="#7c93ff" className="xl:col-span-8">
          <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-1">
              <IconBtn label="Anterior" className="h-8 w-8" onClick={() => shift(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </IconBtn>
              <IconBtn label="Siguiente" className="h-8 w-8" onClick={() => shift(1)}>
                <ChevronRight className="h-4 w-4" />
              </IconBtn>
            </div>
            <div className="min-w-[170px]">
              <h2 className="font-display text-[19px] leading-none font-bold tracking-tight text-mist-50">
                {view === "mes" ? monthTitle(monthKey) : monthTitle(monthKeyOf(selected))}
              </h2>
              <p className="mt-1 text-[11.5px] text-mist-500">
                {view === "mes"
                  ? `${monthPlans.length} sesiones · ${monthExams.length} exámenes · ${monthTasks.length} tareas`
                  : `${fmtMinutes(monthMinutes)} registrados este mes`}
              </p>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="sm" onClick={goToday}>
                Hoy
              </Button>
              <Button variant="outline" size="sm" onClick={openSubjects}>
                Materias
              </Button>
              <Segmented
                value={view}
                onChange={(v) => setView(v)}
                options={[
                  { value: "mes", label: "Mes" },
                  { value: "semana", label: "Semana" },
                ]}
              />
              <Button
                variant="soft"
                size="sm"
                onClick={() => {
                  setSelected(TODAY);
                  setPlanState({ open: true, editing: null });
                }}
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                Planificar
              </Button>
              <Button variant="primary" size="sm" onClick={() => setExamState({ open: true, editing: null })}>
                <GraduationCap className="h-3.5 w-3.5" />
                Examen
              </Button>
            </div>
          </div>

          <div className="px-3 pt-3 pb-4 sm:px-4">
            <div className="mb-1.5 grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((d) => (
                <span key={d} className="px-1 text-center text-[10.5px] font-semibold tracking-[0.1em] text-mist-600 uppercase">
                  {d}
                </span>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${view}-${view === "mes" ? monthKey : startOfWeek(selected)}`}
                initial={{ opacity: 0, x: dir === 0 ? 0 : dir * 26 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir === 0 ? 0 : dir * -26 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className={cn("grid grid-cols-7 gap-1.5", view === "semana" && "sm:gap-2")}
              >
                {cells.map(({ date, inMonth }) => {
                  const data = dayData(date);
                  const minutes = minutesByDate.get(date) ?? 0;
                  const isToday = date === TODAY;
                  const isSelected = date === selected;
                  const past = date < TODAY;
                  const chips = [
                    ...data.exams.map((e) => ({
                      kind: "exam" as const,
                      id: e.id,
                      color: "#ff7a6b",
                      label: e.title,
                      time: e.time,
                      done: false,
                    })),
                    ...data.plans.map((p) => ({
                      kind: "plan" as const,
                      id: p.id,
                      color: subjects.find((s) => s.id === p.subjectId)?.color ?? "#8b7fa5",
                      label: p.title,
                      time: p.start,
                      done: p.done,
                    })),
                    ...data.tasks.map((t) => ({
                      kind: "task" as const,
                      id: t.id,
                      color: t.status === "hecha" ? "#37c7b0" : "#f2a93b",
                      label: t.title,
                      time: "",
                      done: t.status === "hecha",
                    })),
                  ];
                  const visibleChips = view === "semana" ? chips : chips.slice(0, 3);

                  return (
                    <motion.button
                      key={date}
                      onClick={() => {
                        setSelected(date);
                        if (!inMonth && view === "mes") setMonthKey(monthKeyOf(date));
                      }}
                      whileHover={{ y: -2 }}
                      className={cn(
                        "group relative flex cursor-pointer flex-col gap-1 overflow-hidden rounded-xl border p-1.5 text-left transition-all duration-200",
                        view === "semana" ? "min-h-[186px]" : "min-h-[92px]",
                        isSelected
                          ? "border-gold-400/60 bg-gold-400/[0.07] shadow-[0_10px_28px_-18px_rgba(242,169,59,0.9)]"
                          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.16] hover:bg-white/[0.045]",
                        !inMonth && "opacity-40",
                      )}
                    >
                      <span className="flex items-center justify-between gap-1">
                        <span
                          className={cn(
                            "num flex h-5 w-5 items-center justify-center rounded-md text-[11.5px] font-medium",
                            isToday ? "bg-gold-400 text-ink-950" : past ? "text-mist-600" : "text-mist-300",
                          )}
                        >
                          {Number(date.slice(8))}
                        </span>
                        {minutes > 0 && (
                          <span className="num hidden text-[9.5px] text-teal-300 sm:block">{Math.round(minutes / 60)}h</span>
                        )}
                      </span>

                      <span className="flex flex-1 flex-col gap-1">
                        {visibleChips.map((c) => (
                          <span
                            key={`${c.kind}-${c.id}`}
                            title={`${c.time ? c.time + " · " : ""}${c.label}`}
                            className={cn(
                              "flex items-center gap-1 truncate rounded-md px-1 py-[3px] text-[10px] leading-none transition-colors",
                              c.done && "opacity-50",
                            )}
                            style={{
                              background: `${c.color}${c.kind === "exam" ? "26" : "18"}`,
                              color: c.color,
                              boxShadow: c.kind === "exam" ? `inset 0 0 0 1px ${c.color}55` : undefined,
                            }}
                          >
                            {c.kind === "exam" ? (
                              <GraduationCap className="h-2.5 w-2.5 shrink-0" />
                            ) : c.kind === "task" ? (
                              <ListTodo className="h-2.5 w-2.5 shrink-0" />
                            ) : (
                              <Clock3 className="h-2.5 w-2.5 shrink-0" />
                            )}
                            <span className="truncate">
                              {c.time ? `${c.time} ` : ""}
                              {c.label}
                            </span>
                          </span>
                        ))}
                        {view === "mes" && chips.length > 3 && (
                          <span className="px-1 text-[9.5px] text-mist-500">+{chips.length - 3} más</span>
                        )}
                      </span>

                      <span
                        className="h-[3px] w-full overflow-hidden rounded-full bg-white/[0.06]"
                        title={`${fmtMinutes(minutes)} estudiados`}
                      >
                        <span
                          className="block h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (minutes / Math.max(1, settings.dailyMinutes)) * 100)}%`,
                            background: minutes >= settings.dailyMinutes ? "#37c7b0" : "#f2a93b",
                          }}
                        />
                      </span>
                    </motion.button>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* leyenda */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.06] pt-3 text-[11px] text-mist-500">
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap className="h-3 w-3 text-coral-400" /> examen
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3 w-3 text-peri-400" /> sesión planificada
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ListTodo className="h-3 w-3 text-gold-400" /> tarea
              </span>
              <span className="ml-auto hidden items-center gap-2 sm:flex">
                {legend.map((s) => (
                  <span key={s.id} className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </span>
                ))}
              </span>
            </div>
          </div>
        </Panel>

        {/* columna lateral */}
        <div className="flex flex-col gap-4 xl:col-span-4">
          {side}
          <Panel glow="#f2a93b" className="flex flex-1 flex-col">
          <PanelHead
            title={relativeDay(selected)}
            hint={
              selectedMinutes
                ? `${fmtMinutes(selectedMinutes)} estudiados · ${selectedDay.plans.filter((p) => !p.done).length} por hacer`
                : `${selectedDay.plans.length} planificadas · ${selectedDay.exams.length} exámenes`
            }
            action={
              <div className="flex gap-1">
                <IconBtn label="Planificar sesión" className="h-8 w-8" onClick={() => setPlanState({ open: true, editing: null })}>
                  <Plus className="h-3.5 w-3.5" />
                </IconBtn>
                <IconBtn label="Añadir examen" className="h-8 w-8" onClick={() => setExamState({ open: true, editing: null })}>
                  <CalendarDays className="h-3.5 w-3.5" />
                </IconBtn>
              </div>
            }
          />

          <div className="flex-1 space-y-4 overflow-y-auto p-4 scroll-thin">
            {selectedDay.exams.map((e) => {
              const s = subjects.find((x) => x.id === e.subjectId);
              return (
                <div
                  key={e.id}
                  className="group relative overflow-hidden rounded-2xl border border-coral-400/25 bg-coral-400/[0.07] p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-coral-400/15 text-coral-400">
                      <GraduationCap className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-mist-50">{e.title}</p>
                      <p className="mt-0.5 text-[11.5px] text-mist-400">
                        {e.time} · <span style={{ color: s?.color }}>{s?.name}</span>
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-mist-500">
                        <MapPin className="h-3 w-3" />
                        {e.place || "Lugar por confirmar"}
                      </p>
                    </div>
                    <IconBtn
                      label="Eliminar examen"
                      className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 hover:border-coral-400/50 hover:bg-coral-400/10 hover:text-coral-400"
                      onClick={() => {
                        deleteExam(e.id);
                        toast({ title: "Examen eliminado", desc: e.title, tone: "warn" });
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </IconBtn>
                  </div>
                </div>
              );
            })}

            {selectedDay.plans.length > 0 && (
              <div>
                <p className="mb-2 text-[10.5px] font-semibold tracking-[0.14em] text-mist-500 uppercase">
                  Sesiones planificadas
                </p>
                <ul className="space-y-2">
                  {selectedDay.plans.map((p) => {
                    const s = subjects.find((x) => x.id === p.subjectId);
                    return (
                      <li
                        key={p.id}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-2xl border p-3 transition-colors duration-200",
                          p.done
                            ? "border-teal-400/25 bg-teal-400/[0.06]"
                            : "border-white/[0.07] bg-ink-900/50 hover:border-white/[0.16]",
                        )}
                      >
                        <button
                          onClick={() => {
                            setPlanDone(p.id, !p.done);
                            toast({
                              title: p.done ? "Vuelta a pendiente" : "Sesión completada",
                              desc: p.done ? p.title : `${p.title} · ${fmtMinutes(p.minutes)} registrados`,
                              tone: p.done ? "info" : "ok",
                            });
                          }}
                          aria-label={p.done ? "Marcar como pendiente" : "Marcar como completada"}
                          className={cn(
                            "flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-all duration-200 active:scale-90",
                            p.done ? "border-teal-400/50 bg-teal-400 text-ink-950" : "border-white/[0.14] text-mist-500 hover:border-gold-400/60",
                          )}
                        >
                          {p.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                        </button>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block truncate text-[13px] font-medium",
                              p.done ? "text-mist-500 line-through" : "text-mist-100",
                            )}
                          >
                            {p.title}
                          </span>
                          <span className="num mt-0.5 flex items-center gap-1.5 text-[11px] text-mist-500">
                            {p.start} · {fmtMinutes(p.minutes)}
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: s?.color }} />
                            {s?.name}
                          </span>
                        </span>
                        <span className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <IconBtn
                            label="Editar sesión"
                            className="h-7 w-7"
                            onClick={() => setPlanState({ open: true, editing: p })}
                          >
                            <Pencil className="h-3 w-3" />
                          </IconBtn>
                          <IconBtn
                            label="Eliminar sesión"
                            className="h-7 w-7 hover:border-coral-400/50 hover:bg-coral-400/10 hover:text-coral-400"
                            onClick={() => {
                              deletePlan(p.id);
                              toast({ title: "Sesión eliminada", desc: p.title, tone: "warn" });
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </IconBtn>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {selectedDay.tasks.length > 0 && (
              <div>
                <p className="mb-2 text-[10.5px] font-semibold tracking-[0.14em] text-mist-500 uppercase">Tareas con esta fecha</p>
                <ul className="space-y-2">
                  {selectedDay.tasks.map((t) => {
                    const s = subjects.find((x) => x.id === t.subjectId);
                    const done = t.status === "hecha";
                    return (
                      <li
                        key={t.id}
                        className="group flex items-center gap-2.5 rounded-2xl border border-white/[0.07] bg-ink-900/50 p-3 transition-colors hover:border-white/[0.16]"
                      >
                        <button
                          onClick={() => {
                            moveTask(t.id, done ? "pendiente" : "hecha");
                            toast({
                              title: done ? "Tarea reabierta" : "Tarea completada",
                              desc: t.title,
                              tone: done ? "info" : "ok",
                            });
                          }}
                          aria-label={done ? "Reabrir tarea" : "Completar tarea"}
                          className={cn(
                            "flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-all duration-200 active:scale-90",
                            done ? "border-teal-400/50 bg-teal-400 text-ink-950" : "border-white/[0.14] text-mist-500 hover:border-gold-400/60",
                          )}
                        >
                          {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                        </button>
                        <span className="min-w-0 flex-1">
                          <span className={cn("block truncate text-[13px]", done ? "text-mist-500 line-through" : "text-mist-100")}>
                            {t.title}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-mist-500">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: s?.color }} />
                            {s?.name} · prioridad {t.priority}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {!selectedDay.exams.length && !selectedDay.plans.length && !selectedDay.tasks.length && (
              <EmptyState
                icon={<Sparkles className="h-5 w-5" />}
                title="Día libre"
                desc={selectedMinutes ? "No hay nada planificado, pero ya has estudiado hoy." : "Aprovecha para adelantar o descansar."}
                action={
                  <Button variant="soft" size="sm" onClick={() => setPlanState({ open: true, editing: null })}>
                    <CalendarPlus className="h-3.5 w-3.5" />
                    Planificar sesión
                  </Button>
                }
              />
            )}
          </div>

          <footer className="flex items-center gap-2 border-t border-white/[0.06] bg-ink-900/50 px-4 py-3 text-[11.5px] text-mist-500">
            <Timer className="h-3.5 w-3.5 text-teal-400" />
            {selectedMinutes ? `${fmtMinutes(selectedMinutes)} de estudio real` : "Sin sesiones registradas"}
            <span className="ml-auto num">
              {Math.round((Math.min(selectedMinutes, settings.dailyMinutes) / settings.dailyMinutes) * 100)} % de la meta
            </span>
          </footer>
          </Panel>
        </div>
      </div>

      <PlanModal state={planState} onClose={() => setPlanState({ open: false, editing: null })} date={selected} />
      <ExamModal state={examState} onClose={() => setExamState({ open: false, editing: null })} date={selected} />
    </>
  );
}

/* ================================ modales ================================= */

const DURATIONS = [25, 50, 60, 90];

function PlanModal({
  state,
  onClose,
  date,
}: {
  state: { open: boolean; editing: Plan | null };
  onClose: () => void;
  date: string;
}) {
  const { subjects, addPlan, updatePlan } = useStore();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [when, setWhen] = useState(date);
  const [start, setStart] = useState("18:30");
  const [minutes, setMinutes] = useState("50");

  useEffect(() => {
    if (!state.open) return;
    const e = state.editing;
    setTitle(e?.title ?? "");
    setSubjectId(e?.subjectId ?? subjects[0]?.id ?? "");
    setWhen(e?.date ?? date);
    setStart(e?.start ?? "18:30");
    setMinutes(String(e?.minutes ?? 50));
  }, [state.open, state.editing, date, subjects]);

  const save = () => {
    const mins = Number(minutes.replace(",", "."));
    if (!title.trim()) return toast({ title: "Ponle un título", desc: "¿Qué vas a trabajar?", tone: "warn" });
    if (Number.isNaN(mins) || mins <= 0) return toast({ title: "Duración no válida", tone: "warn" });
    const payload = {
      date: when,
      start,
      subjectId,
      title: title.trim(),
      minutes: Math.round(mins),
      done: state.editing?.done ?? false,
      sessionId: state.editing?.sessionId,
    };
    if (state.editing) {
      updatePlan({ ...payload, id: state.editing.id });
      toast({ title: "Sesión actualizada", desc: `${payload.title} · ${shortDate(when)}`, tone: "ok" });
    } else {
      addPlan(payload);
      toast({ title: "Sesión planificada", desc: `${payload.title} · ${shortDate(when)} a las ${start}`, tone: "ok" });
    }
    onClose();
  };

  return (
    <Modal
      open={state.open}
      onClose={onClose}
      title={state.editing ? "Editar sesión planificada" : "Planificar sesión"}
      subtitle="Reserva el bloque en tu agenda de estudio"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={save}>
            <Check className="h-4 w-4" />
            Guardar en la agenda
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Qué vas a trabajar">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Repasar el tema 4 con tarjetas"
            className={inputCls}
          />
        </Field>
        <div>
          <span className="mb-2 block text-[11.5px] font-semibold tracking-[0.08em] text-mist-400 uppercase">Materia</span>
          <div className="flex flex-wrap gap-1.5">
            {subjects.map((s) => {
              const Icon = subjectIcon(s.icon);
              const active = subjectId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSubjectId(s.id)}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12.5px] transition-all duration-200 active:scale-95",
                    active ? "text-ink-950" : "border-white/[0.09] bg-white/[0.03] text-mist-300 hover:border-white/25",
                  )}
                  style={active ? { background: s.color, borderColor: s.color } : undefined}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Fecha">
            <input type="date" value={when} onChange={(e) => setWhen(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Hora">
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={cn(inputCls, "num")} />
          </Field>
          <Field label="Duración" hint="min">
            <input
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              inputMode="numeric"
              className={cn(inputCls, "num no-spin")}
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DURATIONS.map((d) => (
            <Chip key={d} active={Number(minutes) === d} color="#7c93ff" onClick={() => setMinutes(String(d))}>
              {d} min
            </Chip>
          ))}
        </div>
        <p className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-ink-900/50 px-3 py-2.5 text-[11.5px] text-mist-500">
          <BookOpen className="h-3.5 w-3.5 text-gold-400" />
          Al marcarla como completada se registra la sesión de estudio automáticamente.
        </p>
      </div>
    </Modal>
  );
}

function ExamModal({
  state,
  onClose,
  date,
}: {
  state: { open: boolean; editing: Exam | null };
  onClose: () => void;
  date: string;
}) {
  const { subjects, addExam, updateExam } = useStore();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [when, setWhen] = useState(date);
  const [time, setTime] = useState("09:00");
  const [place, setPlace] = useState("");

  useEffect(() => {
    if (!state.open) return;
    const e = state.editing;
    setTitle(e?.title ?? "");
    setSubjectId(e?.subjectId ?? subjects[0]?.id ?? "");
    setWhen(e?.date ?? date);
    setTime(e?.time ?? "09:00");
    setPlace(e?.place ?? "");
  }, [state.open, state.editing, date, subjects]);

  const save = () => {
    if (!title.trim()) return toast({ title: "Ponle nombre al examen", tone: "warn" });
    const payload = { date: when, time, subjectId, title: title.trim(), place: place.trim() };
    if (state.editing) {
      updateExam({ ...payload, id: state.editing.id });
      toast({ title: "Examen actualizado", desc: `${payload.title} · ${countdown(when)}`, tone: "ok" });
    } else {
      addExam(payload);
      toast({ title: "Examen añadido", desc: `${payload.title} · ${countdown(when)}`, tone: "ok" });
    }
    onClose();
  };

  return (
    <Modal
      open={state.open}
      onClose={onClose}
      title={state.editing ? "Editar examen" : "Nuevo examen o entrega"}
      subtitle="Aparecerá en el calendario con su cuenta atrás"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={save}>
            <GraduationCap className="h-4 w-4" />
            Guardar examen
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nombre">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Parcial de Cálculo II"
            className={inputCls}
          />
        </Field>
        <div>
          <span className="mb-2 block text-[11.5px] font-semibold tracking-[0.08em] text-mist-400 uppercase">Materia</span>
          <div className="flex flex-wrap gap-1.5">
            {subjects.map((s) => {
              const Icon = subjectIcon(s.icon);
              const active = subjectId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSubjectId(s.id)}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12.5px] transition-all duration-200 active:scale-95",
                    active ? "text-ink-950" : "border-white/[0.09] bg-white/[0.03] text-mist-300 hover:border-white/25",
                  )}
                  style={active ? { background: s.color, borderColor: s.color } : undefined}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fecha">
            <input type="date" value={when} onChange={(e) => setWhen(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Hora">
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={cn(inputCls, "num")} />
          </Field>
        </div>
        <Field label="Lugar" hint="aula, campus virtual…">
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="Aula 3.2 · Facultad de Ciencias"
            className={inputCls}
          />
        </Field>
        {when && (
          <p className="text-[11.5px] text-mist-500">
            Cuenta atrás: <strong className="text-mist-200">{countdown(when)}</strong>
          </p>
        )}
      </div>
    </Modal>
  );
}
