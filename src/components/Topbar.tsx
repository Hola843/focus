import { motion } from "framer-motion";
import { BookOpen, CalendarCheck, CalendarDays, GraduationCap, ListTodo, Menu, NotebookPen, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { TODAY, longDate } from "../lib/core";
import { useStore } from "../lib/store";
import { useUI, type View } from "../lib/ui-state";

const TITLES: Record<View, { title: string; sub: string }> = {
  hoy: { title: "Hoy", sub: "Rutina, foco y energía del día" },
  habitos: { title: "Hábitos", sub: "Pequeñas decisiones repetidas" },
  estudio: { title: "Estudio", sub: "Materias, sesiones y horas reales" },
  tareas: { title: "Tareas", sub: "Del papel al tablero" },
  diario: { title: "Diario", sub: "Cómo va todo por dentro" },
  progreso: { title: "Progreso", sub: "Lo que dicen los datos" },
};

interface Hit {
  id: string;
  kind: "Tarea" | "Hábito" | "Materia" | "Diario" | "Examen" | "Agenda";
  label: string;
  sub: string;
  view: View;
}

export function Topbar() {
  const { view, setView, setDrawer, openSession } = useUI();
  const { tasks, habits, subjects, entries, exams, plans } = useStore();
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") setFocused(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hits = useMemo<Hit[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const out: Hit[] = [];
    for (const t of tasks)
      if (t.title.toLowerCase().includes(term))
        out.push({ id: t.id, kind: "Tarea", label: t.title, sub: t.status === "hecha" ? "Completada" : "Pendiente", view: "tareas" });
    for (const h of habits)
      if (h.name.toLowerCase().includes(term))
        out.push({ id: h.id, kind: "Hábito", label: h.name, sub: h.note || "Hábito", view: "habitos" });
    for (const s of subjects)
      if (s.name.toLowerCase().includes(term))
        out.push({ id: s.id, kind: "Materia", label: s.name, sub: `${s.targetHours} h objetivo`, view: "estudio" });
    for (const e of entries)
      if (e.text.toLowerCase().includes(term))
        out.push({ id: e.id, kind: "Diario", label: e.text.slice(0, 60) + "…", sub: e.date, view: "diario" });
    for (const e of exams)
      if (e.title.toLowerCase().includes(term))
        out.push({ id: e.id, kind: "Examen", label: e.title, sub: `${e.time} · ${e.place || "sin lugar"}`, view: "estudio" });
    for (const p of plans)
      if (p.title.toLowerCase().includes(term))
        out.push({
          id: p.id,
          kind: "Agenda",
          label: p.title,
          sub: `${p.date} a las ${p.start} · ${p.minutes} min`,
          view: "estudio",
        });
    return out.slice(0, 8);
  }, [q, tasks, habits, subjects, entries, exams, plans]);

  const meta = TITLES[view];

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-900/85 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6">
        <button
          aria-label="Abrir menú"
          onClick={() => setDrawer(true)}
          className="cursor-pointer rounded-lg p-2 text-mist-300 hover:bg-white/[0.06] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <h1 className="font-display text-[20px] leading-none font-bold tracking-tight text-mist-50 sm:text-[23px]">
            {meta.title}
          </h1>
          <p className="mt-1 hidden truncate text-[12.5px] text-mist-500 sm:block">{meta.sub}</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] text-mist-400 xl:inline-flex">
            <CalendarCheck className="h-3.5 w-3.5 text-gold-400" />
            {longDate(TODAY)}
          </span>

          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-mist-500" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => window.setTimeout(() => setFocused(false), 140)}
              placeholder="Buscar tareas, hábitos, materias…"
              className="h-10 w-[250px] rounded-xl border border-white/[0.09] bg-ink-850/80 pr-9 pl-9 text-[13.5px] text-mist-100 placeholder:text-mist-500 outline-none transition-all duration-200 focus:w-[330px] focus:border-gold-400/50 focus:ring-4 focus:ring-gold-400/10"
            />
            <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-mist-500">
              /
            </kbd>

            {focused && q.trim() && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-12 right-0 w-[380px] overflow-hidden rounded-2xl border border-white/[0.09] bg-ink-850 shadow-[0_30px_80px_-30px_rgba(0,0,0,1)]"
              >
                {hits.length === 0 ? (
                  <p className="px-4 py-5 text-[13px] text-mist-500">Sin resultados para “{q}”.</p>
                ) : (
                  <ul className="max-h-[330px] overflow-y-auto py-1.5 scroll-thin">
                    {hits.map((h) => (
                      <li key={`${h.kind}-${h.id}`}>
                        <button
                          onMouseDown={() => {
                            setView(h.view);
                            setQ("");
                          }}
                          className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/[0.05]"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-mist-300">
                            {h.kind === "Tarea" ? (
                              <ListTodo className="h-4 w-4" />
                            ) : h.kind === "Hábito" ? (
                              <CalendarCheck className="h-4 w-4" />
                            ) : h.kind === "Materia" ? (
                              <BookOpen className="h-4 w-4" />
                            ) : h.kind === "Examen" ? (
                              <GraduationCap className="h-4 w-4" />
                            ) : h.kind === "Agenda" ? (
                              <CalendarDays className="h-4 w-4" />
                            ) : (
                              <NotebookPen className="h-4 w-4" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] text-mist-100">{h.label}</span>
                            <span className="block truncate text-[11.5px] text-mist-500">{h.sub}</span>
                          </span>
                          <span className="shrink-0 rounded-full border border-white/[0.1] px-2 py-0.5 text-[10.5px] text-mist-400">
                            {h.kind}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </div>

          <button
            onClick={openSession}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-gold-400 px-3.5 text-[13.5px] font-semibold text-ink-950 shadow-[0_10px_28px_-12px_rgba(242,169,59,0.9)] transition-all hover:bg-gold-300 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
}
