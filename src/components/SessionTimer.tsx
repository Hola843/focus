import { BookOpen, Check, Hourglass, Pause, Play, Plus, Square, Timer, X } from "lucide-react";
import { useState } from "react";
import { TODAY, fmtMinutes, subjectIcon } from "../lib/core";
import { useStore } from "../lib/store";
import { useTimer } from "../lib/timer";
import { useUI } from "../lib/ui-state";
import { cn } from "../utils/cn";
import { Button, Panel, PanelHead, inputCls } from "./ui";

const DURATIONS = [25, 50, 90];

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.max(0, s % 60)).padStart(2, "0")}`;

export function SessionTimer() {
  const { active, mode, running, remaining, start, toggle, stop, cancel, loggedNow } = useTimer();
  const { subjects, plans, settings } = useStore();
  const { openSubjects } = useUI();

  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState(25);

  const pending = plans
    .filter((p) => p.date === TODAY && !p.done)
    .sort((a, b) => (a.start < b.start ? -1 : 1))
    .slice(0, 3);

  const size = 188;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const total = (mode === "focus" ? active?.blockMinutes ?? settings.focus : settings.short) * 60;
  const progress = total ? 1 - remaining / total : 0;
  const color = mode === "focus" ? "#f2a93b" : "#37c7b0";
  const subject = subjects.find((s) => s.id === active?.subjectId);

  const launch = (opts?: { subjectId?: string; title?: string; minutes?: number; planId?: string }) => {
    const sid = opts?.subjectId ?? subjectId ?? subjects[0]?.id;
    if (!sid) return;
    start({
      subjectId: sid,
      title: opts?.title?.trim() || title.trim() || "Sesión de estudio",
      minutes: opts?.minutes ?? minutes,
      planId: opts?.planId,
    });
  };

  /* ------------------------------ sesión activa ----------------------------- */
  if (active) {
    return (
      <Panel glow={color} className="h-full">
        <PanelHead
          title="Sesión en curso"
          hint={`${subject?.name ?? "Estudio"} · ${active.title}`}
          action={
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2 py-1 text-[11px] text-mist-400">
              <span
                className={cn("h-1.5 w-1.5 rounded-full", running ? "bg-teal-400" : "bg-mist-500")}
                style={running ? { animation: "breathe 2s ease-in-out infinite" } : undefined}
              />
              {running ? "en marcha" : "en pausa"}
            </span>
          }
        />
        <div className="flex flex-col items-center gap-4 p-5">
          <div className="relative">
            <svg width={size} height={size} className="-rotate-90">
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                style={{
                  filter: `drop-shadow(0 0 8px ${color}77)`,
                  transition: "stroke-dashoffset 1s linear, stroke 0.4s",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="num text-[40px] leading-none font-bold text-mist-50">{mmss(remaining)}</span>
              <span className="mt-1 text-[10.5px] tracking-[0.14em] text-mist-500 uppercase">
                {mode === "focus" ? "concentración" : "descanso"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: settings.pomodorosLong }).map((_, i) => (
              <span
                key={i}
                className={cn("h-1.5 w-6 rounded-full transition-colors duration-300", i < active.cycles % settings.pomodorosLong || (active.cycles > 0 && active.cycles % settings.pomodorosLong === 0) ? "bg-gold-400" : "bg-white/[0.09]")}
              />
            ))}
          </div>

          <div className="flex w-full items-center justify-center gap-2">
            <Button variant={running ? "soft" : "primary"} onClick={toggle} className="flex-1">
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {running ? "Pausar" : "Reanudar"}
            </Button>
            <Button variant="soft" onClick={stop} title="Terminar y registrar">
              <Square className="h-3.5 w-3.5" />
              Terminar
            </Button>
            <button
              onClick={cancel}
              aria-label="Descartar sesión"
              title="Descartar sin registrar"
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/[0.1] text-mist-500 transition-colors hover:border-coral-400/40 hover:text-coral-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid w-full grid-cols-3 gap-2 border-t border-white/[0.06] pt-4 text-center">
            <div>
              <p className="text-[10.5px] tracking-[0.08em] text-mist-500 uppercase">Bloques</p>
              <p className="num mt-0.5 text-[16px] font-semibold text-mist-50">{active.cycles}</p>
            </div>
            <div>
              <p className="text-[10.5px] tracking-[0.08em] text-mist-500 uppercase">Registrado</p>
              <p className="num mt-0.5 text-[16px] font-semibold text-gold-400">{fmtMinutes(loggedNow)}</p>
            </div>
            <div>
              <p className="text-[10.5px] tracking-[0.08em] text-mist-500 uppercase">Bloque</p>
              <p className="num mt-0.5 text-[16px] font-semibold text-mist-50">{active.blockMinutes}′</p>
            </div>
          </div>
          <p className="text-[11px] text-mist-600">Cada bloque completo se guarda solo en tu registro de estudio.</p>
        </div>
      </Panel>
    );
  }

  /* -------------------------------- arranque ------------------------------- */
  return (
    <Panel glow="#37c7b0" className="h-full">
      <PanelHead title="Sesión de estudio" hint="El temporizador arranca cuando empiezas" />
      <div className="space-y-4 p-5">
        {pending.length > 0 && (
          <div>
            <p className="mb-2 text-[10.5px] font-semibold tracking-[0.14em] text-mist-500 uppercase">Planificado para hoy</p>
            <ul className="space-y-2">
              {pending.map((p) => {
                const s = subjects.find((x) => x.id === p.subjectId);
                const Icon = subjectIcon(s?.icon ?? "BookOpen");
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => launch({ subjectId: p.subjectId, title: p.title, minutes: p.minutes, planId: p.id })}
                      className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-white/[0.07] bg-ink-900/50 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-gold-400/40 hover:bg-ink-900"
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: `${s?.color ?? "#8b7fa5"}1a`, color: s?.color }}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-mist-100">{p.title}</span>
                        <span className="num block text-[11px] text-mist-500">
                          {p.start} · {p.minutes} min
                        </span>
                      </span>
                      <Play className="h-3.5 w-3.5 shrink-0 text-mist-600 transition-colors group-hover:text-gold-400" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {subjects.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/[0.1] px-4 py-6 text-center">
            <BookOpen className="h-5 w-5 text-mist-600" />
            <p className="text-[13px] font-medium text-mist-200">Crea tu primera materia</p>
            <p className="max-w-[240px] text-[11.5px] leading-relaxed text-mist-500">
              Sin materias no puedes cronometrar sesiones ni planificar en el calendario.
            </p>
            <Button variant="soft" size="sm" onClick={openSubjects}>
              <Plus className="h-3.5 w-3.5" />
              Añadir materia
            </Button>
          </div>
        )}

        <div className="border-t border-white/[0.06] pt-4">
          <p className="mb-2 flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.14em] text-mist-500 uppercase">
            <Hourglass className="h-3 w-3" />
            Sesión libre
          </p>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {subjects.map((s) => {
                const Icon = subjectIcon(s.icon);
                const on = subjectId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSubjectId(s.id)}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] transition-all duration-200 active:scale-95",
                      on ? "text-ink-950" : "border-white/[0.09] bg-white/[0.03] text-mist-300 hover:border-white/25",
                    )}
                    style={on ? { background: s.color, borderColor: s.color } : undefined}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {s.name}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-1.5">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setMinutes(d)}
                  className={cn(
                    "num flex-1 cursor-pointer rounded-lg border py-2 text-[12.5px] transition-all duration-200 active:scale-95",
                    minutes === d
                      ? "border-transparent bg-gold-400 text-ink-950"
                      : "border-white/[0.09] bg-white/[0.03] text-mist-400 hover:text-mist-100",
                  )}
                >
                  {d}′
                </button>
              ))}
            </div>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Qué vas a trabajar? (opcional)"
              className={cn(inputCls, "text-[13px]")}
            />

            <Button variant="primary" className="w-full" onClick={() => launch()} disabled={!subjects.length}>
              <Timer className="h-4 w-4" />
              Empezar sesión
            </Button>
          </div>
        </div>

        <p className="flex items-start gap-2 rounded-xl border border-white/[0.07] bg-ink-900/50 px-3 py-2.5 text-[11.5px] leading-relaxed text-mist-500">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-400" />
          Al terminar cada bloque se registra la sesión con su materia y duración. Si la cortas antes, se guarda el
          tiempo real hecho.
        </p>
      </div>
    </Panel>
  );
}

export { SessionTimer as SessionPanel };
