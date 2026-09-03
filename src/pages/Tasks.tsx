import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, GripVertical, ListTodo, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { TodoList } from "../components/TodoList";
import { Button, Chip, EmptyState, Field, IconBtn, Modal, Panel, inputCls, useToast } from "../components/ui";
import {
  PALETTE,
  TODAY,
  addDays,
  relativeDay,
  startOfWeek,
  type Priority,
  type Task,
  type TaskStatus,
} from "../lib/core";
import { useStore } from "../lib/store";
import { cn } from "../utils/cn";

const COLUMNS: { id: TaskStatus; label: string; color: string; hint: string }[] = [
  { id: "pendiente", label: "Pendiente", color: "#7c93ff", hint: "por empezar" },
  { id: "curso", label: "En curso", color: "#f2a93b", hint: "manos a la obra" },
  { id: "hecha", label: "Hecha", color: "#37c7b0", hint: "cerradas" },
];

const PRIORITY_COLOR: Record<Priority, string> = { alta: "#ff7a6b", media: "#f2a93b", baja: "#7c93ff" };

interface Draft {
  title: string;
  subjectId: string;
  priority: Priority;
  due: string;
  status: TaskStatus;
}

export function Tasks() {
  const { tasks, subjects, addTask, updateTask, deleteTask, moveTask } = useStore();
  const toast = useToast();
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<TaskStatus | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>("todas");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "todas">("todas");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);

  const visible = useMemo(
    () =>
      tasks.filter(
        (t) => (subjectFilter === "todas" || t.subjectId === subjectFilter) && (priorityFilter === "todas" || t.priority === priorityFilter),
      ),
    [tasks, subjectFilter, priorityFilter],
  );

  const weekStart = startOfWeek(TODAY);
  const late = visible.filter((t) => t.status !== "hecha" && t.due < TODAY).length;
  const doneWeek = tasks.filter((t) => t.status === "hecha" && t.due >= weekStart).length;

  const openNew = () => {
    setEditing(null);
    setDraft({
      title: "",
      subjectId: subjects[0]?.id ?? "",
      priority: "media",
      due: TODAY,
      status: "pendiente",
    });
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    setDraft({ title: t.title, subjectId: t.subjectId, priority: t.priority, due: t.due, status: t.status });
  };

  const submit = () => {
    if (!draft) return;
    if (!draft.title.trim()) return toast({ title: "Escribe la tarea", tone: "warn" });
    const payload = { ...draft, title: draft.title.trim() };
    if (editing) {
      updateTask({ ...payload, id: editing.id, createdAt: editing.createdAt });
      toast({ title: "Tarea actualizada", desc: payload.title, tone: "ok" });
    } else {
      addTask({ ...payload, createdAt: TODAY });
      toast({ title: "Tarea añadida", desc: payload.title, tone: "ok" });
    }
    setDraft(null);
    setEditing(null);
  };

  const drop = (status: TaskStatus) => {
    setOver(null);
    if (!dragId) return;
    const task = tasks.find((t) => t.id === dragId);
    if (!task || task.status === status) return setDragId(null);
    moveTask(dragId, status);
    toast({
      title: status === "hecha" ? "¡Tarea completada!" : "Tarea movida",
      desc: `${task.title} → ${COLUMNS.find((c) => c.id === status)?.label}`,
      tone: status === "hecha" ? "ok" : "info",
    });
    setDragId(null);
  };

  return (
    <div className="space-y-4">
      {/* cabecera */}
      <Panel glow="#7c93ff" className="flex flex-wrap items-center gap-x-8 gap-y-4 p-5">
        <div>
          <p className="text-[11px] tracking-[0.12em] text-mist-500 uppercase">Tablero</p>
          <p className="num mt-1 text-[26px] leading-none font-bold text-mist-50">
            {tasks.filter((t) => t.status !== "hecha").length}
            <span className="ml-2 text-[14px] font-normal text-mist-500">activas de {tasks.length}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[12.5px]">
          <span className="text-mist-400">
            Vencidas <strong className={cn("num", late ? "text-coral-400" : "text-mist-100")}>{late}</strong>
          </span>
          <span className="text-mist-400">
            Cerradas esta semana <strong className="num text-teal-300">{doneWeek}</strong>
          </span>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className={cn(inputCls, "h-10 w-auto py-0")}
          >
            <option value="todas" className="bg-ink-850">
              Todas las materias
            </option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id} className="bg-ink-850">
                {s.name}
              </option>
            ))}
          </select>
          <div className="flex gap-1.5">
            <Chip active={priorityFilter === "todas"} onClick={() => setPriorityFilter("todas")}>
              Todo
            </Chip>
            {(["alta", "media", "baja"] as const).map((p) => (
              <Chip key={p} active={priorityFilter === p} color={PRIORITY_COLOR[p]} onClick={() => setPriorityFilter(p)}>
                {p}
              </Chip>
            ))}
          </div>
          <Button variant="primary" size="md" onClick={openNew}>
            <Plus className="h-4 w-4" />
            Nueva tarea
          </Button>
        </div>
      </Panel>

      {/* lista rápida de cosas pequeñas */}
      <TodoList variant="compact" title="Cosas pequeñas" hint="Tacha lo que ya está y arrastra para ordenar el día" />

      {/* columnas */}
      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const list = visible
            .filter((t) => t.status === col.id)
            .sort((a, b) => (a.due < b.due ? -1 : 1));
          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(col.id);
              }}
              onDragLeave={() => setOver((o) => (o === col.id ? null : o))}
              onDrop={() => drop(col.id)}
              className={cn(
                "flex min-h-[320px] flex-col rounded-[22px] border bg-ink-850/60 transition-colors duration-200",
                over === col.id ? "border-gold-400/50 bg-gold-400/[0.05]" : "border-white/[0.07]",
              )}
            >
              <header className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />
                <h3 className="font-display text-[14.5px] font-semibold text-mist-50">{col.label}</h3>
                <span className="num rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-mist-400">{list.length}</span>
                <span className="ml-auto text-[11px] text-mist-600">{col.hint}</span>
              </header>

              <div className="flex-1 space-y-2.5 p-3">
                {list.map((t) => {
                  const subject = subjects.find((s) => s.id === t.subjectId);
                  const isLate = t.status !== "hecha" && t.due < TODAY;
                  return (
                    <motion.article
                      key={t.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: dragId === t.id ? 0.5 : 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      draggable
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => setDragId(null)}
                      className="group cursor-grab rounded-2xl border border-white/[0.07] bg-ink-800/80 p-3.5 shadow-[0_10px_24px_-18px_rgba(0,0,0,1)] transition-all duration-200 hover:border-white/[0.16] hover:bg-ink-800 active:cursor-grabbing"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-mist-600 transition-colors group-hover:text-mist-400" />
                        <p
                          className={cn(
                            "flex-1 text-[13.5px] leading-snug font-medium",
                            t.status === "hecha" ? "text-mist-500 line-through" : "text-mist-100",
                          )}
                        >
                          {t.title}
                        </p>
                        <span className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <IconBtn label="Editar" className="h-7 w-7" onClick={() => openEdit(t)}>
                            <Pencil className="h-3 w-3" />
                          </IconBtn>
                          <IconBtn
                            label="Eliminar"
                            className="h-7 w-7 hover:border-coral-400/50 hover:bg-coral-400/10 hover:text-coral-400"
                            onClick={() => {
                              deleteTask(t.id);
                              toast({ title: "Tarea eliminada", desc: t.title, tone: "warn" });
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </IconBtn>
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {subject && (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                            style={{ background: `${subject.color}1a`, color: subject.color }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: subject.color }} />
                            {subject.name}
                          </span>
                        )}
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                            isLate ? "bg-coral-400/15 text-coral-400" : "bg-white/[0.05] text-mist-400",
                          )}
                        >
                          {isLate ? <TriangleAlert className="h-3 w-3" /> : null}
                          {relativeDay(t.due)}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                          style={{ background: `${PRIORITY_COLOR[t.priority]}1a`, color: PRIORITY_COLOR[t.priority] }}
                        >
                          {t.priority}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-1.5 border-t border-white/[0.05] pt-2.5">
                        {COLUMNS.filter((c) => c.id !== t.status).map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              moveTask(t.id, c.id);
                              toast({
                                title: c.id === "hecha" ? "¡Tarea completada!" : "Tarea movida",
                                desc: `${t.title} → ${c.label}`,
                                tone: c.id === "hecha" ? "ok" : "info",
                              });
                            }}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-mist-500 transition-colors hover:bg-white/[0.06] hover:text-mist-100"
                          >
                            {c.id === "hecha" ? <CheckCircle2 className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </motion.article>
                  );
                })}

                {list.length === 0 && (
                  <div className="flex h-[220px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.09] text-center">
                    <ListTodo className="h-5 w-5 text-mist-600" />
                    <p className="text-[12.5px] text-mist-500">Suelta aquí una tarea</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {visible.length === 0 && (
        <Panel>
          <EmptyState
            icon={<ListTodo className="h-5 w-5" />}
            title="Nada con esos filtros"
            desc="Cambia la materia o la prioridad, o crea una tarea nueva."
            action={
              <Button variant="primary" size="sm" onClick={openNew}>
                Nueva tarea
              </Button>
            }
          />
        </Panel>
      )}

      {/* modal */}
      <Modal
        open={!!draft}
        onClose={() => {
          setDraft(null);
          setEditing(null);
        }}
        title={editing ? "Editar tarea" : "Nueva tarea"}
        subtitle="Concreta, con fecha y con materia"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setDraft(null);
                setEditing(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="primary" onClick={submit}>
              Guardar
            </Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            <Field label="Qué hay que hacer">
              <input
                autoFocus
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Entregar el problema 7"
                className={inputCls}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Materia">
                <select
                  value={draft.subjectId}
                  onChange={(e) => setDraft({ ...draft, subjectId: e.target.value })}
                  className={inputCls}
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id} className="bg-ink-850">
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fecha límite">
                <input
                  type="date"
                  value={draft.due}
                  onChange={(e) => setDraft({ ...draft, due: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Prioridad">
              <div className="flex gap-1.5">
                {(["alta", "media", "baja"] as const).map((p) => (
                  <Chip key={p} active={draft.priority === p} color={PRIORITY_COLOR[p]} onClick={() => setDraft({ ...draft, priority: p })}>
                    {p}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="Estado">
              <div className="flex gap-1.5">
                {COLUMNS.map((c) => (
                  <Chip key={c.id} active={draft.status === c.id} color={c.color} onClick={() => setDraft({ ...draft, status: c.id })}>
                    {c.label}
                  </Chip>
                ))}
              </div>
            </Field>
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 7].map((d) => (
                <button
                  key={d}
                  onClick={() => setDraft({ ...draft, due: addDays(TODAY, d) })}
                  className="cursor-pointer rounded-lg border border-white/[0.09] px-2.5 py-1 text-[12px] text-mist-400 transition-colors hover:border-gold-400/40 hover:text-gold-300"
                >
                  +{d} {d === 1 ? "día" : "días"}
                </button>
              ))}
            </div>
            <p className="flex items-center gap-2 text-[11.5px] text-mist-600">
              <span className="h-2 w-2 rounded-full" style={{ background: PALETTE[0] }} />
              Arrastra las tarjetas entre columnas para cambiar su estado.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
