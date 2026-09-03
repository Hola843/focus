import { AnimatePresence, motion } from "framer-motion";
import { Check, GripVertical, ListChecks, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useTodos } from "../lib/todos";
import { cn } from "../utils/cn";
import { Button, Chip, IconBtn, Panel, PanelHead, Ring, inputCls, useToast } from "./ui";

type Filter = "todas" | "pendientes" | "hechas";

export function TodoList({ variant = "full", title, hint }: { variant?: "full" | "compact"; title?: string; hint?: string }) {
  const { todos, add, toggle, update, remove, reorder, clearDone, doneCount } = useTodos();
  const toast = useToast();
  const [text, setText] = useState("");
  const [filter, setFilter] = useState<Filter>("todas");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const list = useMemo(
    () => (filter === "pendientes" ? todos.filter((t) => !t.done) : filter === "hechas" ? todos.filter((t) => t.done) : todos),
    [todos, filter],
  );

  const total = todos.length;
  const ratio = total ? doneCount / total : 0;
  const allDone = total > 0 && doneCount === total;

  const submit = () => {
    if (!text.trim()) {
      inputRef.current?.focus();
      return;
    }
    add(text);
    setText("");
  };

  const drop = (to: number) => {
    if (dragIndex !== null && dragIndex !== to) reorder(dragIndex, to);
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <Panel glow="#37c7b0" className="h-full">
      <PanelHead
        title={title ?? "Pequeñas cosas"}
        hint={hint ?? "Lo que no merece una tarea entera, pero se te olvida"}
        action={
          <div className="flex flex-wrap items-center gap-1.5">
            {(["todas", "pendientes", "hechas"] as const).map((f) => (
              <Chip key={f} active={filter === f} color="#37c7b0" onClick={() => setFilter(f)}>
                {f}
              </Chip>
            ))}
            {doneCount > 0 && (
              <IconBtn
                label="Limpiar las hechas"
                className="h-8 w-8 hover:border-coral-400/40 hover:bg-coral-400/10 hover:text-coral-400"
                onClick={() => {
                  clearDone();
                  toast({ title: "Lista despejada", desc: `${doneCount} cosas cerradas y fuera.`, tone: "info" });
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </IconBtn>
            )}
          </div>
        }
      />

      <div className={cn("flex gap-5 p-4", variant === "full" ? "flex-col lg:flex-row" : "flex-col")}>
        {/* columna principal */}
        <div className="min-w-0 flex-1">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Añadir algo pequeño que hacer hoy…"
                className={cn(inputCls, "pr-10")}
              />
              <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-mist-600">
                ⏎
              </kbd>
            </div>
            <Button variant="primary" onClick={submit} className="shrink-0 px-3.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Añadir</span>
            </Button>
          </div>

          {list.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.09] px-4 py-9 text-center">
              <ListChecks className="h-5 w-5 text-mist-600" />
              <p className="text-[13px] text-mist-400">
                {filter === "hechas" ? "Todavía no has tachado nada." : filter === "pendientes" ? "Nada pendiente. Buen síntoma." : "Tu lista está vacía."}
              </p>
              <p className="text-[11.5px] text-mist-600">Arrastra para reordenar · doble clic para editar</p>
            </div>
          ) : (
            <ul className={cn("mt-3 space-y-1.5", variant === "compact" && "lg:grid lg:grid-cols-2 lg:gap-x-3 lg:space-y-0")}>
              <AnimatePresence initial={false}>
                {list.map((t) => {
                  const index = todos.findIndex((x) => x.id === t.id);
                  const editing = editingId === t.id;
                  return (
                    <motion.li
                      key={t.id}
                      layout
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, x: -24, height: 0 }}
                      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                      draggable={!editing}
                      onDragStart={() => setDragIndex(index)}
                      onDragEnter={() => setOverIndex(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => drop(index)}
                      onDragEnd={() => {
                        setDragIndex(null);
                        setOverIndex(null);
                      }}
                      onDoubleClick={() => {
                        setEditingId(t.id);
                        setDraft(t.text);
                      }}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all duration-200",
                        overIndex === index && dragIndex !== index
                          ? "border-gold-400/60 bg-gold-400/[0.07]"
                          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.045]",
                        dragIndex === index && "opacity-40",
                      )}
                    >
                      <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-mist-600 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing" />

                      <motion.button
                        onClick={() => toggle(t.id)}
                        whileTap={{ scale: 0.86 }}
                        aria-label={t.done ? "Marcar como pendiente" : "Marcar como hecha"}
                        className={cn(
                          "flex h-[22px] w-[22px] shrink-0 cursor-pointer items-center justify-center rounded-[7px] border transition-all duration-200",
                          t.done
                            ? "border-teal-400/60 bg-teal-400 text-ink-950"
                            : "border-white/[0.16] text-transparent hover:border-gold-400/70 hover:text-gold-400/60",
                        )}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </motion.button>

                      {editing ? (
                        <input
                          autoFocus
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onBlur={() => {
                            update(t.id, draft);
                            setEditingId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              update(t.id, draft);
                              setEditingId(null);
                            }
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="min-w-0 flex-1 rounded-lg border border-gold-400/40 bg-ink-900 px-2 py-1 text-[13.5px] text-mist-50 outline-none"
                        />
                      ) : (
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate text-[13.5px] transition-colors duration-200",
                            t.done ? "text-mist-600 line-through" : "text-mist-100",
                          )}
                        >
                          {t.text}
                        </span>
                      )}

                      <span className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <IconBtn
                          label="Editar"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingId(t.id);
                            setDraft(t.text);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </IconBtn>
                        <IconBtn
                          label="Eliminar"
                          className="h-7 w-7 hover:border-coral-400/50 hover:bg-coral-400/10 hover:text-coral-400"
                          onClick={() => remove(t.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </IconBtn>
                      </span>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>

        {/* progreso */}
        <div
          className={cn(
            "shrink-0 rounded-2xl border border-white/[0.07] bg-ink-900/50 p-4",
            variant === "full" ? "lg:w-[186px]" : "flex items-center gap-4",
          )}
        >
          <div className="flex items-center gap-4">
            <Ring value={ratio} size={variant === "full" ? 84 : 62} stroke={8} color={allDone ? "#37c7b0" : "#f2a93b"}>
              <span className="num text-[15px] font-bold text-mist-50">
                {doneCount}
                <span className="text-[11px] text-mist-500">/{total}</span>
              </span>
            </Ring>
            <div className="min-w-0">
              <p className="text-[10.5px] tracking-[0.1em] text-mist-500 uppercase">Progreso</p>
              <p className="num mt-0.5 text-[19px] font-semibold text-mist-50">{Math.round(ratio * 100)} %</p>
              <p className="mt-1 text-[11px] leading-snug text-mist-500">
                {allDone ? "Todo tachado. Día cerrado." : `${total - doneCount} por hacer`}
              </p>
            </div>
          </div>
          {variant === "full" && (
            <p className="mt-3 flex items-start gap-2 border-t border-white/[0.06] pt-3 text-[11px] leading-relaxed text-mist-600">
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-gold-400" />
              Arrastra las filas para ordenarlas por cómo vas a hacerlas, no por cómo se te ocurrieron.
            </p>
          )}
        </div>
      </div>
    </Panel>
  );
}
