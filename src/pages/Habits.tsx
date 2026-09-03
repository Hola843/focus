import { motion } from "framer-motion";
import { CalendarCheck, Check, Flame, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { TrendLine } from "../components/charts";
import { Button, EmptyState, Field, IconBtn, Modal, Panel, PanelHead, Ring, inputCls, useToast } from "../components/ui";
import {
  HABIT_ICONS,
  PALETTE,
  TODAY,
  addDays,
  completionRate,
  daysBack,
  habitIcon,
  pct,
  relativeDay,
  shortDate,
  weekLabel,
  weeklyCompletion,
  type Habit,
} from "../lib/core";
import { useStore } from "../lib/store";
import { cn } from "../utils/cn";

const HEAT_DAYS = 30;
const ICON_KEYS = Object.keys(HABIT_ICONS);

interface Draft {
  name: string;
  note: string;
  icon: string;
  color: string;
  weekly: number;
}

const emptyDraft = (): Draft => ({ name: "", note: "", icon: "BookOpen", color: PALETTE[0], weekly: 5 });

export function Habits() {
  const { habits, logs, streaks, bestStreaks, addHabit, updateHabit, deleteHabit, toggleHabit } = useStore();
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);

  const days = useMemo(() => daysBack(HEAT_DAYS), []);
  const weeks = useMemo(() => weeklyCompletion(
    habits.flatMap((h) => logs[h.id] ?? []),
    8,
  ), [habits, logs]);

  const globalRate = useMemo(() => {
    const w = daysBack(30);
    const total = habits.length * w.length;
    const done = habits.reduce((acc, h) => acc + (logs[h.id] ?? []).filter((d) => w.includes(d)).length, 0);
    return total ? done / total : 0;
  }, [habits, logs, days]);

  const perfectDays = useMemo(() => {
    return days.filter((d) => habits.length > 0 && habits.every((h) => (logs[h.id] ?? []).includes(d))).length;
  }, [days, habits, logs]);

  const bestGlobal = Math.max(0, ...habits.map((h) => bestStreaks[h.id] ?? 0));

  const submit = () => {
    if (!draft.name.trim()) return toast({ title: "Ponle nombre al hábito", tone: "warn" });
    const payload = { ...draft, name: draft.name.trim(), note: draft.note.trim() };
    if (editing) {
      updateHabit({ ...payload, id: editing.id });
      toast({ title: "Hábito actualizado", desc: payload.name, tone: "ok" });
      setEditing(null);
    } else {
      addHabit(payload);
      toast({ title: "Hábito creado", desc: `${payload.name} · ${payload.weekly} días/semana`, tone: "ok" });
      setCreating(false);
    }
    setDraft(emptyDraft());
  };

  return (
    <div className="space-y-4">
      {/* resumen */}
      <Panel glow="#f06ba8" className="grid grid-cols-2 divide-white/[0.06] sm:grid-cols-4 sm:divide-x">
        <Stat label="Hábitos activos" value={String(habits.length)} hint="en seguimiento" />
        <Stat label="Constancia 30 días" value={pct(globalRate)} hint="de todos los días" accent />
        <Stat label="Mejor racha" value={`${bestGlobal} días`} hint="histórico" />
        <Stat label="Días perfectos" value={String(perfectDays)} hint="en el último mes" />
      </Panel>

      {/* mapa de calor */}
      <Panel>
        <PanelHead
          title="Mapa de constancia"
          hint={`${HEAT_DAYS} días · pulsa una casilla para marcar o desmarcar`}
          action={
            <Button variant="primary" size="sm" onClick={() => { setDraft(emptyDraft()); setCreating(true); }}>
              <Plus className="h-3.5 w-3.5" />
              Nuevo hábito
            </Button>
          }
        />
        {habits.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="h-5 w-5" />}
            title="Todavía no hay hábitos"
            desc="Empieza con uno pequeño: la constancia se construye día a día."
            action={
              <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
                Crear hábito
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto px-5 py-5 scroll-thin">
            <div className="min-w-[640px] space-y-2">
              <div className="flex items-center gap-2 pl-[172px]">
                {days.map((d) => (
                  <span key={d} className="w-[15px] text-center text-[9px] text-mist-600">
                    {d === TODAY ? "hoy" : Number(d.slice(8)) % 10 === 0 ? d.slice(8) : ""}
                  </span>
                ))}
              </div>
              {habits.map((h) => {
                const Icon = habitIcon(h.icon);
                const done = logs[h.id] ?? [];
                return (
                  <div key={h.id} className="flex items-center gap-2">
                    <span className="flex w-[172px] shrink-0 items-center gap-2 pr-2">
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                        style={{ background: `${h.color}1a`, color: h.color }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate text-[12.5px] text-mist-300">{h.name}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {days.map((d) => {
                        const isDone = done.includes(d);
                        const future = d > TODAY;
                        return (
                          <motion.button
                            key={d}
                            whileHover={{ scale: 1.35 }}
                            whileTap={{ scale: 0.9 }}
                            disabled={future}
                            onClick={() => toggleHabit(h.id, d)}
                            title={`${h.name} · ${relativeDay(d)}${isDone ? " ✓" : ""}`}
                            className={cn(
                              "h-[15px] w-[15px] cursor-pointer rounded-[4px] border transition-colors duration-200",
                              future && "cursor-not-allowed opacity-30",
                            )}
                            style={{
                              background: isDone ? h.color : "rgba(255,255,255,0.045)",
                              borderColor: isDone ? h.color : "rgba(255,255,255,0.06)",
                              boxShadow: isDone ? `0 0 8px ${h.color}55` : undefined,
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.06] pt-4 text-[11.5px] text-mist-500">
              <span>{shortDate(days[0])} — {shortDate(days[days.length - 1])}</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-white/[0.06]" /> sin marcar
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-gold-400" /> cumplido
              </span>
            </div>
          </div>
        )}
      </Panel>

      <div className="grid gap-4 xl:grid-cols-12">
        {/* tarjetas */}
        <div className="grid gap-4 md:grid-cols-2 xl:col-span-8">
          {habits.map((h, i) => {
            const Icon = habitIcon(h.icon);
            const done = logs[h.id] ?? [];
            const rate = completionRate(done, 30);
            const last14 = daysBack(14);
            return (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3 }}
                className="group relative overflow-hidden rounded-[22px] border border-white/[0.07] bg-ink-850/80 p-5 transition-colors duration-200 hover:border-white/[0.16]"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full opacity-[0.14] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.26]"
                  style={{ background: h.color }}
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-2xl"
                      style={{ background: `${h.color}1f`, color: h.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[15px] leading-tight font-semibold text-mist-50">{h.name}</p>
                      <p className="text-[11.5px] text-mist-500">objetivo {h.weekly} días/semana</p>
                    </div>
                  </div>
                  <span className="flex gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    <IconBtn
                      label="Editar hábito"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditing(h);
                        setDraft({ name: h.name, note: h.note, icon: h.icon, color: h.color, weekly: h.weekly });
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn
                      label="Eliminar hábito"
                      className="h-8 w-8 hover:border-coral-400/50 hover:bg-coral-400/10 hover:text-coral-400"
                      onClick={() => {
                        deleteHabit(h.id);
                        toast({ title: "Hábito eliminado", desc: h.name, tone: "warn" });
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconBtn>
                  </span>
                </div>

                {h.note && <p className="mt-3 text-[12.5px] leading-relaxed text-mist-400">{h.note}</p>}

                <div className="mt-4 flex items-center gap-4">
                  <Ring value={rate} size={72} stroke={7} color={h.color}>
                    <span className="num text-[12.5px] font-semibold text-mist-50">{Math.round(rate * 100)}%</span>
                  </Ring>
                  <div className="flex-1 space-y-2">
                    <p className="flex items-center gap-1.5 text-[12px] text-mist-300">
                      <Flame className="h-3.5 w-3.5" style={{ color: (streaks[h.id] ?? 0) > 0 ? "#f2a93b" : undefined }} />
                      Racha actual: <strong className="num text-mist-50">{streaks[h.id] ?? 0} días</strong>
                    </p>
                    <p className="text-[12px] text-mist-500">
                      Récord: <span className="num text-mist-300">{bestStreaks[h.id] ?? 0} días</span> · 30 d:{" "}
                      <span className="num text-mist-300">{done.filter((d) => d >= addDays(TODAY, -29)).length}</span>
                    </p>
                    <div className="flex gap-1">
                      {last14.map((d) => {
                        const isDone = done.includes(d);
                        return (
                          <span
                            key={d}
                            title={`${relativeDay(d)}${isDone ? " ✓" : ""}`}
                            className="h-2 flex-1 rounded-full transition-colors"
                            style={{ background: isDone ? h.color : "rgba(255,255,255,0.07)" }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleHabit(h.id, TODAY)}
                  className={cn(
                    "mt-4 flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-[12.5px] font-medium transition-all duration-200 active:scale-[0.98]",
                    done.includes(TODAY) ? "bg-white/[0.06] text-mist-400" : "text-ink-950",
                  )}
                  style={done.includes(TODAY) ? undefined : { background: h.color }}
                >
                  <Check className="h-3.5 w-3.5" />
                  {done.includes(TODAY) ? "Marcado hoy" : "Marcar hoy"}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* evolución */}
        <div className="space-y-4 xl:col-span-4">
          <Panel glow="#7c93ff">
            <PanelHead title="Constancia semanal" hint="% de hábitos cumplidos por semana" />
            <div className="h-[220px] px-3 pt-4 pb-2">
              <TrendLine
                labels={weeks.map((w) => shortDate(w.end))}
                series={[{ label: "Constancia", color: "#7c93ff", data: weeks.map((w) => w.rate) }]}
                unit="percent"
              />
            </div>
          </Panel>
          <Panel>
            <PanelHead title="Cómo lo llevas" hint="Semana en curso" />
            <ul className="divide-y divide-white/[0.05]">
              {habits.map((h) => {
                const week = daysBack(7);
                const done = (logs[h.id] ?? []).filter((d) => week.includes(d)).length;
                const ok = done >= h.weekly;
                return (
                  <li key={h.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="h-2 w-2 rounded-full" style={{ background: h.color }} />
                    <span className="flex-1 truncate text-[12.5px] text-mist-300">{h.name}</span>
                    <span className="num text-[12px] text-mist-500">
                      {done}/{h.weekly}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                        ok ? "bg-teal-400/12 text-teal-300" : "bg-white/[0.05] text-mist-500",
                      )}
                    >
                      {ok ? "objetivo" : "en curso"}
                    </span>

                  </li>
                );
              })}
            </ul>
            <p className="border-t border-white/[0.06] px-5 py-3 text-[11.5px] text-mist-500">
              Semana {weekLabel(TODAY)}
            </p>
          </Panel>
        </div>
      </div>

      {/* modal */}
      <Modal
        open={creating || !!editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={editing ? "Editar hábito" : "Nuevo hábito"}
        subtitle="Pequeño, medible y repetible"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="primary" onClick={submit}>
              {editing ? "Guardar cambios" : "Crear hábito"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nombre">
            <input
              autoFocus
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Leer 20 minutos"
              className={inputCls}
            />
          </Field>
          <Field label="Nota" hint="por qué importa">
            <input
              value={draft.note}
              onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
              placeholder="Sin pantallas antes de dormir"
              className={inputCls}
            />
          </Field>
          <div>
            <span className="mb-2 block text-[11.5px] font-semibold tracking-[0.08em] text-mist-400 uppercase">Icono</span>
            <div className="flex flex-wrap gap-1.5">
              {ICON_KEYS.map((k) => {
                const I = HABIT_ICONS[k];
                return (
                  <button
                    key={k}
                    onClick={() => setDraft((d) => ({ ...d, icon: k }))}
                    className={cn(
                      "cursor-pointer rounded-lg border p-2 transition-all duration-200 active:scale-95",
                      draft.icon === k ? "border-transparent text-ink-950" : "border-white/[0.09] bg-white/[0.03] text-mist-400 hover:text-mist-100",
                    )}
                    style={draft.icon === k ? { background: draft.color } : undefined}
                  >
                    <I className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <span className="mb-2 block text-[11.5px] font-semibold tracking-[0.08em] text-mist-400 uppercase">Color</span>
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setDraft((d) => ({ ...d, color: c }))}
                  className={cn(
                    "h-8 w-8 cursor-pointer rounded-full transition-transform duration-200 hover:scale-110",
                    draft.color === c && "ring-2 ring-mist-50 ring-offset-2 ring-offset-ink-850",
                  )}
                  style={{ background: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
          <Field label="Días objetivo por semana" hint={`${draft.weekly} días`}>
            <input
              type="range"
              min={1}
              max={7}
              value={draft.weekly}
              onChange={(e) => setDraft((d) => ({ ...d, weekly: Number(e.target.value) }))}
              className="w-full accent-[#f2a93b]"
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

function Stat({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className="px-5 py-4">
      <p className="text-[11px] tracking-[0.1em] text-mist-500 uppercase">{label}</p>
      <p className={cn("num mt-1 text-[22px] font-semibold", accent ? "text-gold-400" : "text-mist-50")}>{value}</p>
      {hint && <p className="mt-0.5 text-[11.5px] text-mist-500">{hint}</p>}
    </div>
  );
}
