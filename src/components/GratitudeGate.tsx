import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, HeartHandshake, Lock, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TODAY, longDate, relativeDay } from "../lib/core";
import { useStore } from "../lib/store";
import { dueLabel, useUI } from "../lib/ui-state";
import { cn } from "../utils/cn";
import { Starfield } from "./Starfield";
import { inputCls, useToast } from "./ui";

const PROMPTS = [
  { n: "01", label: "Algo pequeño de hoy", hint: "Un café, una luz, un mensaje…" },
  { n: "02", label: "Alguien que sumó", hint: "Una persona que te lo hizo más fácil" },
  { n: "03", label: "Algo de ti", hint: "Un esfuerzo o una capacidad propia" },
];

export function GratitudeGate() {
  const { unlocked, unlock, gratitudeOpen, closeGratitude, lastGratitude } = useUI();
  const { addGratitude, todayGratitude, gratitudes, gratitudeStreak } = useStore();
  const toast = useToast();

  const open = !unlocked || gratitudeOpen;
  const dismissable = unlocked;

  const [items, setItems] = useState<string[]>(["", "", ""]);
  const [touched, setTouched] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    setItems(todayGratitude?.items.length === 3 ? [...todayGratitude.items] : ["", "", ""]);
    if (!unlocked) window.setTimeout(() => refs.current[0]?.focus(), 420);
  }, [open, todayGratitude, unlocked]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const filled = items.map((i) => i.trim().length >= 2);
  const count = filled.filter(Boolean).length;
  const ready = count === 3;

  const yesterday = gratitudes.find((g) => g.date !== TODAY);

  const submit = () => {
    setTouched(true);
    if (!ready) {
      refs.current[filled.findIndex((f) => !f)]?.focus();
      return;
    }
    addGratitude(TODAY, items.map((i) => i.trim()));
    unlock();
    closeGratitude();
    toast({
      title: "Ritual completado",
      desc: "Tres cosas que agradeces. Ya puedes empezar el día.",
      tone: "ok",
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03, filter: "blur(10px)" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label="Ritual de entrada: tres agradecimientos"
        >
          {/* fondo propio */}
          <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950">
            <div className="animate-drift absolute -top-40 left-1/4 h-[620px] w-[620px] rounded-full bg-gold-400/14 blur-[140px]" />
            <div className="animate-drift-slow absolute -right-32 bottom-0 h-[520px] w-[520px] rounded-full bg-rose-400/10 blur-[130px]" />
            <div className="animate-drift absolute -bottom-40 -left-24 h-[480px] w-[480px] rounded-full bg-teal-400/10 blur-[130px]" />
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
                backgroundSize: "64px 64px",
                maskImage: "radial-gradient(ellipse at 30% 20%, black 10%, transparent 75%)",
              }}
            />
            <svg className="absolute inset-x-0 top-1/2 h-[420px] w-full opacity-[0.22]" viewBox="0 0 1200 420" fill="none" preserveAspectRatio="none">
              <motion.path
                d="M-20 320C180 320 220 120 420 120s240 200 440 200 260-160 380-160"
                stroke="url(#g1)"
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3.2, ease: "easeInOut" }}
              />
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#f2a93b" stopOpacity="0" />
                  <stop offset="0.4" stopColor="#f2a93b" />
                  <stop offset="0.75" stopColor="#f06ba8" />
                  <stop offset="1" stopColor="#f06ba8" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <Starfield />
            <div className="grain absolute inset-0 opacity-[0.04]" />
          </div>

          <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-12 lg:gap-14 lg:py-14">
            {/* columna editorial */}
            <div className="lg:col-span-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-400 text-ink-950">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                    <path d="M4 19c3.5 0 4.5-14 8-14s4.5 14 8 14" />
                    <circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none" />
                  </svg>
                </span>
                <span className="leading-none">
                  <span className="block font-display text-[19px] font-bold tracking-tight text-mist-50">Estela</span>
                  <span className="block text-[10.5px] tracking-[0.16em] text-mist-500 uppercase">Ritual de entrada</span>
                </span>
              </div>

              <p className="mt-9 flex items-center gap-2 text-[11.5px] font-semibold tracking-[0.16em] text-mist-500 uppercase">
                <span className="pulse-ring h-1.5 w-1.5 rounded-full bg-gold-400" />
                {longDate(TODAY)}
              </p>

              <h1 className="font-display mt-4 text-[40px] leading-[0.98] font-extrabold tracking-tight text-mist-50 sm:text-[54px]">
                Antes de
                <br />
                <span className="text-mist-400">entrar,</span> tres cosas
                <br />
                <span className="relative inline-block text-gold-400">
                  que agradeces.
                  <motion.svg
                    viewBox="0 0 320 14"
                    className="absolute -bottom-2 left-0 h-3 w-full"
                    fill="none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <motion.path
                      d="M2 9C60 3 130 12 190 6s90 2 128 4"
                      stroke="#f2a93b"
                      strokeWidth="3"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </motion.svg>
                </span>
              </h1>

              <p className="mt-7 max-w-sm text-[14px] leading-relaxed text-mist-400">
                No hace falta que sean grandes. Escribir tres cosas antes de mirar tareas, horas o rachas cambia el
                punto de partida del día — y la app no se abre hasta que lo hagas. Solo te lo pedimos una vez cada 24
                horas: si lo haces por la mañana, por la tarde entras directo.
              </p>

              <div className="mt-8 flex items-center gap-5">
                <div className="relative flex h-[86px] w-[86px] items-center justify-center">
                  <svg viewBox="0 0 86 86" className="absolute -rotate-90">
                    <circle cx="43" cy="43" r="37" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                    <motion.circle
                      cx="43"
                      cy="43"
                      r="37"
                      fill="none"
                      stroke="#f2a93b"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 37}
                      animate={{ strokeDashoffset: 2 * Math.PI * 37 * (1 - count / 3) }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      style={{ filter: "drop-shadow(0 0 8px rgba(242,169,59,0.6))" }}
                    />
                  </svg>
                  <span className="num text-[20px] font-bold text-mist-50">
                    {count}
                    <span className="text-[13px] text-mist-500">/3</span>
                  </span>
                </div>
                <div className="space-y-1.5 text-[12.5px] text-mist-500">
                  <p className="flex items-center gap-2">
                    <HeartHandshake className="h-4 w-4 text-rose-400" />
                    {gratitudeStreak > 0
                      ? `Llevas ${gratitudeStreak} ${gratitudeStreak === 1 ? "día" : "días"} seguidos con el ritual`
                      : "Empieza hoy tu racha de gratitud"}
                  </p>
                  <p className="flex items-center gap-2">
                    {unlocked ? (
                      <Sparkles className="h-4 w-4 text-teal-400" />
                    ) : (
                      <Lock className="h-4 w-4 text-mist-600" />
                    )}
                    {unlocked ? dueLabel(lastGratitude) : "La app sigue bloqueada hasta completar las tres"}
                  </p>
                </div>
              </div>

              {yesterday && (
                <div className="mt-8 max-w-sm rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                  <p className="text-[10.5px] tracking-[0.14em] text-mist-500 uppercase">
                    {relativeDay(yesterday.date)} agradeciste
                  </p>
                  <p className="mt-1.5 font-display text-[14.5px] leading-snug text-mist-200 italic">
                    «{yesterday.items[0]}»
                  </p>
                </div>
              )}
            </div>

            {/* columna de escritura */}
            <div className="lg:col-span-7">
              <div className="relative overflow-hidden rounded-[26px] border border-white/[0.09] bg-ink-900/80 p-5 shadow-[0_50px_120px_-40px_rgba(0,0,0,1)] backdrop-blur-xl sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-[20px] font-bold tracking-tight text-mist-50">
                      Hoy agradezco…
                    </h2>
                    <p className="mt-1 text-[12.5px] text-mist-500">
                      Pulsa Intro para pasar a la siguiente. Se guarda en tu diario.
                    </p>
                  </div>
                  {dismissable && (
                    <button
                      onClick={closeGratitude}
                      aria-label="Cerrar"
                      className="cursor-pointer rounded-lg p-2 text-mist-500 transition-colors hover:bg-white/[0.06] hover:text-mist-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  {PROMPTS.map((p, i) => {
                    const ok = filled[i];
                    return (
                      <motion.label
                        key={p.n}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12 + i * 0.09, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className={cn(
                          "group relative flex items-center gap-4 overflow-hidden rounded-2xl border p-4 transition-all duration-300",
                          ok
                            ? "border-teal-400/35 bg-teal-400/[0.06]"
                            : "border-white/[0.08] bg-ink-850/70 hover:border-white/[0.18] focus-within:border-gold-400/50 focus-within:bg-ink-850",
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "absolute top-0 bottom-0 left-0 w-[3px] transition-colors duration-300",
                            ok ? "bg-teal-400" : "bg-transparent group-focus-within:bg-gold-400",
                          )}
                        />
                        <span
                          className={cn(
                            "num w-[34px] shrink-0 text-[15px] font-bold transition-colors duration-300",
                            ok ? "text-teal-400" : "text-mist-600 group-focus-within:text-gold-400",
                          )}
                        >
                          {p.n}
                        </span>
                        <span className="min-w-0 flex-1">
                          <input
                            ref={(el) => {
                              refs.current[i] = el;
                            }}
                            value={items[i]}
                            onChange={(e) =>
                              setItems((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                            }
                            onKeyDown={(e) => {
                              if (e.key !== "Enter") return;
                              e.preventDefault();
                              if (i < 2) refs.current[i + 1]?.focus();
                              else submit();
                            }}
                            placeholder={p.hint}
                            aria-label={p.label}
                            className={cn(
                              inputCls,
                              "border-0 bg-transparent px-0 py-0 text-[15.5px] font-medium focus:ring-0",
                              ok ? "text-mist-50" : "text-mist-100",
                            )}
                          />
                          <span className="mt-1 block text-[11px] text-mist-600">{p.label}</span>
                        </span>
                        <motion.span
                          initial={false}
                          animate={{ scale: ok ? 1 : 0.4, opacity: ok ? 1 : 0.25 }}
                          transition={{ type: "spring", stiffness: 420, damping: 22 }}
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            ok ? "bg-teal-400 text-ink-950" : "border border-white/[0.12] text-mist-600",
                          )}
                        >
                          <Check className="h-4 w-4" strokeWidth={3} />
                        </motion.span>
                      </motion.label>
                    );
                  })}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-5">
                  <button
                    onClick={submit}
                    disabled={!ready}
                    className={cn(
                      "inline-flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 text-[14.5px] font-semibold transition-all duration-300 sm:flex-none",
                      ready
                        ? "bg-gold-400 text-ink-950 shadow-[0_14px_36px_-14px_rgba(242,169,59,0.95)] hover:bg-gold-300 active:scale-[0.98]"
                        : "cursor-not-allowed bg-white/[0.05] text-mist-600",
                    )}
                  >
                    {ready ? <Sparkles className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    {ready ? "Entrar a Estela" : `Faltan ${3 - count} ${3 - count === 1 ? "cosa" : "cosas"}`}
                    {ready && <ArrowRight className="h-4 w-4" />}
                  </button>
                  <p className="text-[11.5px] text-mist-600">
                    {touched && !ready
                      ? "Escribe algo en cada una, aunque sea corto."
                      : todayGratitude
                        ? "Ya escribiste tus tres cosas hoy: puedes editarlas y entrar."
                        : "Nadie más va a leer esto. Escribe de verdad."}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-center text-[11.5px] text-mist-600 sm:text-left">
                Consejo: cuanto más concreto el detalle, más se queda. «El café» funciona peor que «el café tranquilo
                de las siete».
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


