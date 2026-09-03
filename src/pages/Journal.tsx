import { motion } from "framer-motion";
import { HeartHandshake, NotebookPen, Pencil, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button, Chip, EmptyState, IconBtn, Modal, Panel, PanelHead, inputCls, useToast } from "../components/ui";
import {
  JOURNAL_TAGS,
  TODAY,
  longDate,
  relativeDay,
  type Entry,
} from "../lib/core";
import { useStore } from "../lib/store";
import { useUI } from "../lib/ui-state";
import { cn } from "../utils/cn";

export function Journal() {
  const { entries, addEntry, updateEntry, deleteEntry, gratitudes, gratitudeStreak, todayGratitude } = useStore();
  const { journalModal, openJournal, closeJournal, openGratitude } = useUI();
  const toast = useToast();

  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [date, setDate] = useState(TODAY);
  const [q, setQ] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [editing, setEditing] = useState<Entry | null>(null);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return entries.filter(
      (e) =>
        (!tagFilter || e.tags.includes(tagFilter)) &&
        (!term || e.text.toLowerCase().includes(term) || e.tags.some((t) => t.includes(term))),
    );
  }, [entries, q, tagFilter]);

  const allTags = useMemo(() => [...new Set(entries.flatMap((e) => e.tags))], [entries]);
  const words = entries.reduce((sum, e) => sum + e.text.trim().split(/\s+/).filter(Boolean).length, 0);

  const save = () => {
    if (!text.trim()) return toast({ title: "Escribe algo", desc: "Aunque sean dos líneas.", tone: "warn" });
    const payload = { date, text: text.trim(), tags };
    if (editing) {
      updateEntry({ ...payload, id: editing.id });
      toast({ title: "Nota actualizada", desc: relativeDay(date), tone: "ok" });
      setEditing(null);
    } else {
      addEntry(payload);
      toast({ title: "Nota guardada", desc: relativeDay(date), tone: "ok" });
    }
    setText("");
    setTags([]);
    setDate(TODAY);
    closeJournal();
  };

  return (
    <div className="space-y-4">
      {/* cabecera */}
      <Panel glow="#f06ba8" className="flex flex-wrap items-center gap-x-8 gap-y-4 p-5">
        <div>
          <h2 className="font-display text-[21px] leading-none font-bold tracking-tight text-mist-50">Diario</h2>
          <p className="mt-1.5 text-[12.5px] text-mist-500">
            {longDate(TODAY)} · {entries.length} {entries.length === 1 ? "nota" : "notas"} · {words.toLocaleString("es-ES")}{" "}
            palabras escritas
          </p>
        </div>
        <p className="max-w-md text-[12.5px] leading-relaxed text-mist-400">
          Dos líneas al final del día bastan: qué funcionó, qué no y qué pruebas mañana. Con el tiempo es el mejor
          registro de cómo estudias de verdad.
        </p>
        <Button variant="primary" className="ml-auto" onClick={openJournal}>
          <NotebookPen className="h-4 w-4" />
          Escribir nota
        </Button>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-12">
        {/* filtros */}
        <Panel className="xl:col-span-4">
          <PanelHead title="Buscar" hint={`${visible.length} de ${entries.length} notas`} />
          <div className="space-y-3 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-mist-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar en el diario…"
                className={cn(inputCls, "pl-9")}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Chip active={!tagFilter} onClick={() => setTagFilter(null)}>
                Todas
              </Chip>
              {allTags.map((t) => (
                <Chip key={t} active={tagFilter === t} color="#f06ba8" onClick={() => setTagFilter(tagFilter === t ? null : t)}>
                  #{t}
                </Chip>
              ))}
            </div>
            {tagFilter && (
              <button
                onClick={() => setTagFilter(null)}
                className="cursor-pointer text-[12px] text-mist-400 underline decoration-dotted underline-offset-4 hover:text-mist-100"
              >
                Quitar filtro de etiqueta
              </button>
            )}
          </div>
        </Panel>

        {/* notas */}
        <Panel className="xl:col-span-8">
          <PanelHead title="Tus notas" hint="De la más reciente a la más antigua" />
          {visible.length === 0 ? (
            <EmptyState
              icon={<NotebookPen className="h-5 w-5" />}
              title="Sin notas todavía"
              desc="Escribir dos líneas al día cambia cómo recuerdas el proceso."
              action={
                <Button variant="primary" size="sm" onClick={openJournal}>
                  Escribir la primera
                </Button>
              }
            />
          ) : (
            <ul className="max-h-[560px] divide-y divide-white/[0.05] overflow-y-auto scroll-thin">
              {visible.map((e) => (
                <motion.li
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative flex gap-4 px-5 py-4 transition-colors hover:bg-white/[0.03]"
                >
                  <span aria-hidden className="absolute top-0 bottom-0 left-0 w-[3px] bg-rose-400/50" />
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-400/12 text-rose-400">
                    <NotebookPen className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12.5px] font-medium text-mist-200">{relativeDay(e.date)}</span>
                      <span className="ml-auto flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <IconBtn
                          label="Editar nota"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditing(e);
                            setText(e.text);
                            setTags(e.tags);
                            setDate(e.date);
                            openJournal();
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </IconBtn>
                        <IconBtn
                          label="Eliminar nota"
                          className="h-7 w-7 hover:border-coral-400/50 hover:bg-coral-400/10 hover:text-coral-400"
                          onClick={() => {
                            deleteEntry(e.id);
                            toast({ title: "Nota eliminada", tone: "warn" });
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </IconBtn>
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-mist-300">{e.text}</p>
                    {e.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {e.tags.map((t) => (
                          <span key={t} className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10.5px] text-mist-400">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </Panel>

        {/* registro de gratitud */}
        <Panel glow="#f2a93b" className="xl:col-span-12">
          <PanelHead
            title="Registro de gratitud"
            hint={`${gratitudes.length} ${gratitudes.length === 1 ? "día guardado" : "días guardados"} · racha de ${gratitudeStreak}`}
            action={
              <Button variant="soft" size="sm" onClick={openGratitude}>
                <HeartHandshake className="h-3.5 w-3.5" />
                {todayGratitude ? "Editar las de hoy" : "Escribir las de hoy"}
              </Button>
            }
          />
          <div className="grid gap-px bg-white/[0.04] sm:grid-cols-2 xl:grid-cols-3">
            {gratitudes.slice(0, 6).map((g) => (
              <div key={g.id} className="group bg-ink-850 px-5 py-4 transition-colors duration-200 hover:bg-ink-800">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] tracking-[0.12em] text-mist-500 uppercase">{relativeDay(g.date)}</span>
                  {g.date === TODAY && (
                    <span className="rounded-full bg-gold-400/15 px-2 py-0.5 text-[10px] font-medium text-gold-300">
                      hoy
                    </span>
                  )}
                </div>
                <ul className="mt-2 space-y-1.5">
                  {g.items.map((it, i) => (
                    <li key={i} className="flex gap-2 text-[12.5px] leading-snug text-mist-300">
                      <span className="num mt-[1px] shrink-0 text-[10px] text-mist-600">0{i + 1}</span>
                      <span className="min-w-0">{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {gratitudes.length === 0 && (
              <div className="bg-ink-850 px-5 py-8 text-[13px] text-mist-500">
                Todavía no hay agradecimientos guardados.
              </div>
            )}
          </div>
        </Panel>
      </div>

      {/* modal */}
      <Modal
        open={journalModal}
        onClose={() => {
          closeJournal();
          setEditing(null);
        }}
        title={editing ? "Editar nota" : "Nueva nota del diario"}
        subtitle={longDate(date)}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                closeJournal();
                setEditing(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="primary" onClick={save}>
              Guardar nota
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[11.5px] font-semibold tracking-[0.08em] text-mist-400 uppercase">Fecha</span>
            <input type="date" max={TODAY} value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11.5px] font-semibold tracking-[0.08em] text-mist-400 uppercase">
              Qué ha pasado hoy
            </span>
            <textarea
              autoFocus
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Lo que ha funcionado, lo que no, lo que probarás mañana…"
              className={cn(inputCls, "resize-none leading-relaxed")}
            />
          </label>
          <div>
            <span className="mb-2 block text-[11.5px] font-semibold tracking-[0.08em] text-mist-400 uppercase">Etiquetas</span>
            <div className="flex flex-wrap gap-1.5">
              {JOURNAL_TAGS.map((t) => (
                <Chip
                  key={t}
                  active={tags.includes(t)}
                  color="#f06ba8"
                  onClick={() => setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))}
                >
                  #{t}
                </Chip>
              ))}
            </div>
          </div>
          <p className="text-[11.5px] text-mist-600">
            {text.trim() ? `${text.trim().split(/\s+/).length} palabras` : "Sin prisa: escribe lo que necesites."}
          </p>
        </div>
      </Modal>
    </div>
  );
}
