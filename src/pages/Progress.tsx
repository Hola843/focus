import { motion } from "framer-motion";
import { Award, Flame, Lock, Target } from "lucide-react";
import { useMemo } from "react";
import { BalanceRadar, TrendLine } from "../components/charts";
import { Bar, Panel, PanelHead } from "../components/ui";
import {
  TODAY,
  addDays,
  daysBack,
  fmtHours,
  fmtMinutes,
  minutesBetween,
  minutesBySubject,
  minutesOn,
  pct,
  shortDate,
  weekLabel,
  weeklyCompletion,
  weeklyMinutes,
} from "../lib/core";
import { useStore } from "../lib/store";
import { cn } from "../utils/cn";

const stagger = { show: { transition: { staggerChildren: 0.05 } } };
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

export function Progress() {
  const { habits, logs, subjects, sessions, entries, tasks, bestStreaks, settings } = useStore();

  const from = addDays(TODAY, -29);
  const weeks = useMemo(() => weeklyMinutes(sessions, 8), [sessions]);
  const constancy = useMemo(
    () => weeklyCompletion(habits.flatMap((h) => logs[h.id] ?? []), 8),
    [habits, logs],
  );
  const total30 = useMemo(() => minutesBetween(sessions, from, TODAY), [sessions, from]);
  const rate30 = useMemo(() => {
    const w = new Set(daysBack(30));
    const total = habits.length * 30;
    const done = habits.reduce((acc, h) => acc + (logs[h.id] ?? []).filter((d) => w.has(d)).length, 0);
    return total ? done / total : 0;
  }, [habits, logs]);

  const bestStreak = Math.max(0, ...habits.map((h) => bestStreaks[h.id] ?? 0));
  const bestDay = useMemo(() => {
    const days = daysBack(56);
    let best = { date: "", minutes: 0 };
    for (const d of days) {
      const m = minutesOn(sessions, d);
      if (m > best.minutes) best = { date: d, minutes: m };
    }
    return best;
  }, [sessions]);

  const bySubject30 = useMemo(() => minutesBySubject(sessions, from), [sessions, from]);
  const radarData = subjects.map((s) => bySubject30.get(s.id) ?? 0);
  const activeSubjects = radarData.filter((m) => m > 0).length;

  const perfect7 = useMemo(() => {
    const w = daysBack(7);
    return w.filter((d) => habits.length > 0 && habits.every((h) => (logs[h.id] ?? []).includes(d))).length;
  }, [habits, logs]);

  const closedTasks = tasks.filter((t) => t.status === "hecha").length;
  const maxWeek = Math.max(1, ...weeks.map((w) => w.minutes));

  const badges = [
    {
      name: "Primera semana fuerte",
      desc: "Una semana con 5 horas de estudio",
      value: Math.min(1, maxWeek / 300),
      detail: `mejor semana ${fmtMinutes(maxWeek)}`,
      color: "#f2a93b",
    },
    {
      name: "Racha de 7 días",
      desc: "Siete días seguidos con un hábito",
      value: Math.min(1, bestStreak / 7),
      detail: `récord ${bestStreak} días`,
      color: "#ff7a6b",
    },
    {
      name: "Racha de 21 días",
      desc: "El hábito ya casi es automático",
      value: Math.min(1, bestStreak / 21),
      detail: `récord ${bestStreak} días`,
      color: "#f06ba8",
    },
    {
      name: "Jornada profunda",
      desc: "Cuatro horas de estudio en un día",
      value: Math.min(1, bestDay.minutes / 240),
      detail: bestDay.date ? `${fmtMinutes(bestDay.minutes)} el ${shortDate(bestDay.date)}` : "sin sesiones",
      color: "#37c7b0",
    },
    {
      name: "Centurión",
      desc: "100 sesiones registradas",
      value: Math.min(1, sessions.length / 100),
      detail: `${sessions.length} sesiones`,
      color: "#7c93ff",
    },
    {
      name: "Constancia de hierro",
      desc: "75 % de hábitos en 30 días",
      value: Math.min(1, rate30 / 0.75),
      detail: `ahora ${pct(rate30)}`,
      color: "#9fd356",
    },
    {
      name: "Polímata",
      desc: "Cuatro materias activas este mes",
      value: Math.min(1, activeSubjects / 4),
      detail: `${activeSubjects} materias`,
      color: "#ffc96b",
    },
    {
      name: "Escritor constante",
      desc: "Diez notas en el diario",
      value: Math.min(1, entries.length / 10),
      detail: `${entries.length} notas`,
      color: "#b3a8c9",
    },
  ];

  const weekRows = useMemo(() => {
    return weeks
      .map((w, i) => {
        const days = daysBack(7, addDays(w.start, 6));
        const sessionCount = sessions.filter((s) => s.date >= w.start && s.date <= addDays(w.start, 6)).length;
        return {
          start: w.start,
          minutes: w.minutes,
          sessions: sessionCount,
          rate: constancy[i]?.rate ?? 0,
          perfect: days.filter((d) => habits.length > 0 && habits.every((h) => (logs[h.id] ?? []).includes(d))).length,
        };
      })
      .reverse();
  }, [weeks, constancy, sessions, habits, logs]);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      {/* KPIs */}
      <motion.div
        variants={item}
        className="grid grid-cols-2 divide-white/[0.06] rounded-[22px] border border-white/[0.07] bg-ink-850/70 sm:grid-cols-3 sm:divide-x xl:grid-cols-6"
      >
        <Kpi label="Estudio 30 d" value={fmtHours(total30)} color="#f2a93b" />
        <Kpi label="Constancia 30 d" value={pct(rate30)} color="#f06ba8" />
        <Kpi label="Mejor racha" value={`${bestStreak} d`} color="#ff7a6b" />
        <Kpi label="Sesiones" value={String(sessions.length)} color="#37c7b0" />
        <Kpi label="Tareas cerradas" value={String(closedTasks)} color="#7c93ff" />
        <Kpi label="Notas escritas" value={String(entries.length)} color="#9fd356" />
      </motion.div>

      <div className="grid gap-4 xl:grid-cols-12">
        {/* horas por semana */}
        <motion.div variants={item} className="xl:col-span-8">
          <Panel>
            <PanelHead title="Horas de estudio por semana" hint="Ocho últimas semanas" />
            <div className="h-[250px] px-3 pt-4 pb-2">
              <TrendLine
                labels={weeks.map((w) => shortDate(w.start))}
                series={[{ label: "Estudio", color: "#f2a93b", data: weeks.map((w) => w.minutes) }]}
              />
            </div>
          </Panel>
        </motion.div>

        {/* constancia */}
        <motion.div variants={item} className="xl:col-span-4">
          <Panel glow="#f06ba8" className="h-full">
            <PanelHead title="Constancia semanal" hint="% de hábitos cumplidos" />
            <div className="h-[250px] px-3 pt-4 pb-2">
              <TrendLine
                labels={constancy.map((c) => shortDate(c.end))}
                series={[{ label: "Constancia", color: "#f06ba8", data: constancy.map((c) => c.rate) }]}
                unit="percent"
              />
            </div>
          </Panel>
        </motion.div>

        {/* radar */}
        <motion.div variants={item} className="xl:col-span-5">
          <Panel glow="#7c93ff" className="h-full">
            <PanelHead title="Equilibrio entre materias" hint="Minutos de los últimos 30 días" />
            <div className="h-[290px] px-3 pt-4 pb-2">
              <BalanceRadar labels={subjects.map((s) => s.name)} data={radarData} />
            </div>
          </Panel>
        </motion.div>

        {/* logros */}
        <motion.div variants={item} className="xl:col-span-7">
          <Panel className="h-full">
            <PanelHead
              title="Logros"
              hint={`${badges.filter((b) => b.value >= 1).length} de ${badges.length} desbloqueados`}
              action={<Award className="h-4 w-4 text-gold-400" />}
            />
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              {badges.map((b) => {
                const unlocked = b.value >= 1;
                return (
                  <div
                    key={b.name}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300",
                      unlocked
                        ? "border-gold-400/30 bg-gold-400/[0.06]"
                        : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14]",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
                          unlocked ? "bg-gold-400 text-ink-950" : "bg-white/[0.05] text-mist-500",
                        )}
                      >
                        {unlocked ? <Award className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-[13.5px] font-semibold", unlocked ? "text-mist-50" : "text-mist-300")}>
                          {b.name}
                        </p>
                        <p className="mt-0.5 text-[11.5px] text-mist-500">{b.desc}</p>
                      </div>
                    </div>
                    <Bar value={b.value} color={unlocked ? "#f2a93b" : b.color} height={5} className="mt-3" />
                    <p className="mt-1.5 text-[11px] text-mist-600">{b.detail}</p>
                  </div>
                );
              })}
            </div>
          </Panel>
        </motion.div>

        {/* tabla semanal */}
        <motion.div variants={item} className="xl:col-span-12">
          <Panel>
            <PanelHead title="Semana a semana" hint="Horas, sesiones, constancia y días perfectos" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[11px] tracking-[0.1em] text-mist-500 uppercase">
                    <th className="px-5 py-3 font-semibold">Semana</th>
                    <th className="px-5 py-3 font-semibold">Estudio</th>
                    <th className="px-5 py-3 font-semibold">Sesiones</th>
                    <th className="px-5 py-3 font-semibold">Constancia</th>
                    <th className="px-5 py-3 font-semibold">Días perfectos</th>
                    <th className="px-5 py-3 font-semibold">Volumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {weekRows.map((r) => (
                    <tr key={r.start} className="transition-colors hover:bg-white/[0.03]">
                      <td className="px-5 py-3 text-[13px] font-medium text-mist-100">{weekLabel(r.start)}</td>
                      <td className="num px-5 py-3 text-[13px] text-gold-300">{fmtHours(r.minutes)}</td>
                      <td className="num px-5 py-3 text-[13px] text-mist-300">{r.sessions}</td>
                      <td className="num px-5 py-3 text-[13px] text-mist-300">{pct(r.rate)}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 text-[12.5px] text-mist-300">
                          <Flame className={cn("h-3.5 w-3.5", r.perfect > 0 ? "text-coral-400" : "text-mist-600")} />
                          {r.perfect}
                        </span>
                      </td>
                      <td className="w-[180px] px-5 py-3">
                        <Bar value={r.minutes / maxWeek} color="#f2a93b" height={6} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </motion.div>

        {/* ritmo */}
        <motion.div variants={item} className="xl:col-span-12">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-[22px] border border-white/[0.07] bg-ink-850/50 px-6 py-4 text-[12.5px] text-mist-400">
            <span className="inline-flex items-center gap-2">
              <Target className="h-4 w-4 text-gold-400" />
              Meta diaria <strong className="num text-mist-100">{fmtMinutes(settings.dailyMinutes)}</strong>
            </span>
            <span>
              Días perfectos (7 d): <strong className="num text-mist-100">{perfect7}</strong>
            </span>
            <span>
              Mejor día: <strong className="text-mist-100">{bestDay.date ? `${shortDate(bestDay.date)} · ${fmtMinutes(bestDay.minutes)}` : "—"}</strong>
            </span>
            <span>
              Media semanal: <strong className="num text-mist-100">{fmtHours(weeks.reduce((s, w) => s + w.minutes, 0) / weeks.length)}</strong>
            </span>
            <span className="ml-auto text-mist-600">Datos guardados en tu navegador</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function Kpi({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="border-b border-white/[0.06] px-5 py-4 transition-colors duration-200 hover:bg-white/[0.03] sm:border-b-0">
      <p className="flex items-center gap-1.5 text-[10.5px] tracking-[0.1em] text-mist-500 uppercase">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
        {label}
      </p>
      <p className="num mt-1.5 text-[21px] font-semibold text-mist-50">{value}</p>
    </div>
  );
}
