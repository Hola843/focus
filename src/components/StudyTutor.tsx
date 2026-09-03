import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  CalendarClock,
  Check,
  Copy,
  GraduationCap,
  History,
  MessageSquarePlus,
  Send,
  Sparkles,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { fmtMinutes, TODAY } from "../lib/core";
import { useStore } from "../lib/store";
import { useTodos } from "../lib/todos";
import {
  askTutor,
  contextMessage,
  HEALTH_ENDPOINT,
  loadThreads,
  newThread,
  renderMarkdown,
  saveThreads,
  suggestionsFor,
  type ChatMessage,
  type Thread,
  type TutorContext,
} from "../lib/tutor";
import { cn } from "../utils/cn";
import { Button, IconBtn, Panel, PanelHead, useToast } from "./ui";

const uid = () => Math.random().toString(36).slice(2, 10);

export function StudyTutor() {
  const { subjects, exams, sessions, habits, logs, weekMinutes } = useStore();
  const { todos } = useTodos();
  const toast = useToast();

  const ctx = useMemo<TutorContext>(() => {
    const next = exams.filter((e) => e.date >= TODAY)[0];
    return {
      subjects: subjects.map((s) => s.name),
      nextExam: next
        ? {
            title: next.title,
            subject: subjects.find((s) => s.id === next.subjectId)?.name ?? "materia",
            days: Math.round((new Date(next.date).getTime() - new Date(TODAY).getTime()) / 86400000),
            place: next.place,
          }
        : null,
      weekMinutes,
      recentSessions: [...sessions]
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 4)
        .map((s) => ({ subject: subjects.find((x) => x.id === s.subjectId)?.name ?? "Materia", minutes: s.minutes })),
      habits: habits.map((h) => ({
        name: h.name,
        streak: (() => {
          const set = new Set(logs[h.id] ?? []);
          let cursor = TODAY;
          if (!set.has(cursor)) cursor = new Date(new Date(TODAY).getTime() - 86400000).toISOString().slice(0, 10);
          let n = 0;
          while (set.has(cursor)) {
            n++;
            cursor = new Date(new Date(cursor).getTime() - 86400000).toISOString().slice(0, 10);
          }
          return n;
        })(),
      })),
      pendingTodos: todos.filter((t) => !t.done).length,
    };
  }, [subjects, exams, sessions, habits, logs, weekMinutes, todos]);

  const [threads, setThreads] = useState<Thread[]>(() => loadThreads());
  const [activeId, setActiveId] = useState<string>("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const active = threads.find((t) => t.id === activeId) ?? null;
  const visible = (active?.messages ?? []).filter((m) => !m.hidden);
  const suggestions = useMemo(() => suggestionsFor(ctx), [ctx]);

  useEffect(() => {
    if (!threads.length) {
      const t = newThread(ctx);
      setThreads([t]);
      setActiveId(t.id);
    } else if (!activeId) {
      setActiveId(threads[0].id);
    }
  }, [threads, activeId, ctx]);

  useEffect(() => {
    saveThreads(threads);
  }, [threads]);

  // comprueba si el backend Express está levantado al abrir la sección
  useEffect(() => {
    let alive = true;
    fetch(HEALTH_ENDPOINT)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as { keyConfigurada?: boolean };
      })
      .then((d) => alive && setOnline(Boolean(d.keyConfigurada)))
      .catch(() => alive && setOnline(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visible.length, busy, activeId]);

  const upsert = (list: Thread[], thread: Thread) => {
    const exists = list.some((t) => t.id === thread.id);
    const next = exists ? list.map((t) => (t.id === thread.id ? thread : t)) : [thread, ...list];
    return next.sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1));
  };

  const send = async (raw: string) => {
    const clean = raw.trim();
    if (!clean || busy) return;

    let base = active ?? newThread(ctx);
    if (!base.messages.some((m) => m.hidden)) base = { ...base, messages: [contextMessage(ctx), ...base.messages] };

    const userMsg: ChatMessage = { id: uid(), role: "user", content: clean, at: new Date().toISOString() };
    const withUser: Thread = {
      ...base,
      title: base.title === "Nueva conversación" ? clean.slice(0, 46) : base.title,
      updatedAt: new Date().toISOString(),
      messages: [...base.messages, userMsg],
    };

    setThreads((prev) => upsert(prev, withUser));
    setActiveId(withUser.id);
    setInput("");
    setBusy(true);
    if (areaRef.current) areaRef.current.style.height = "auto";

    const { reply, online: isOnline } = await askTutor(withUser.messages, ctx, clean);
    const botMsg: ChatMessage = { id: uid(), role: "assistant", content: reply, at: new Date().toISOString() };
    setThreads((prev) =>
      upsert(prev, { ...withUser, updatedAt: new Date().toISOString(), messages: [...withUser.messages, botMsg] }),
    );
    setOnline(isOnline);
    setBusy(false);
    if (!isOnline) toast({ title: "Tutor en modo local", desc: "Sin conexión con el modelo; uso tus datos.", tone: "info" });
  };

  const startNew = () => {
    const t = newThread(ctx);
    setThreads((prev) => [t, ...prev]);
    setActiveId(t.id);
    setInput("");
  };

  const removeThread = (id: string) => {
    const next = threads.filter((t) => t.id !== id);
    setThreads(next);
    if (id === activeId) setActiveId(next[0]?.id ?? "");
    toast({ title: "Conversación eliminada", tone: "warn" });
  };

  return (
    <Panel glow="#7c93ff">
      <PanelHead
        title="Tutor de estudio"
        hint="Dudas, resúmenes, planes de repaso y exámenes de prueba con tu calendario de fondo"
        action={
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-medium",
                online === null
                  ? "border-white/[0.1] text-mist-500"
                  : online
                    ? "border-teal-400/35 bg-teal-400/10 text-teal-300"
                    : "border-gold-400/35 bg-gold-400/10 text-gold-300",
              )}
            >
              {online === null ? <Sparkles className="h-3 w-3" /> : online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {online === null ? "Listo" : online ? "Gemini conectado" : "Modo local"}
            </span>
            <Button variant="soft" size="sm" onClick={startNew}>
              <MessageSquarePlus className="h-3.5 w-3.5" />
              Nueva
            </Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-[1fr_272px]">
        {/* hilo de conversación */}
        <div className="flex min-w-0 flex-col border-b border-white/[0.06] lg:border-r lg:border-b-0">
          <div ref={scrollRef} className="h-[420px] space-y-4 overflow-y-auto p-4 sm:h-[460px] sm:p-5 scroll-thin">
            {visible.length === 0 && !busy && (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <span className="pulse-ring flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-500 text-ink-950">
                  <GraduationCap className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-display text-[17px] font-semibold text-mist-50">¿Qué estás estudiando hoy?</p>
                  <p className="mx-auto mt-1 max-w-sm text-[12.5px] leading-relaxed text-mist-500">
                    El tutor ya conoce tus materias
                    {ctx.nextExam ? `, tu próximo examen (${ctx.nextExam.title}, en ${ctx.nextExam.days} días)` : ""} y tus
                    horas de la semana.
                  </p>
                </div>
                <div className="grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
                  {suggestions.slice(0, 4).map((s) => (
                    <button
                      key={s.label}
                      onClick={() => void send(s.prompt)}
                      className="group cursor-pointer rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-gold-400/40 hover:bg-white/[0.06]"
                    >
                      <span className="flex items-start gap-2">
                        <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-gold-400" />
                        <span className="text-[12px] leading-snug text-mist-300 transition-colors group-hover:text-mist-100">
                          {s.label}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {visible.map((m) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className={cn("flex gap-2.5", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  {m.role === "assistant" && (
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 text-ink-950">
                      <Bot className="h-4 w-4" />
                    </span>
                  )}
                  <div
                    className={cn(
                      "group relative max-w-[86%] rounded-2xl px-3.5 py-2.5 sm:max-w-[76%]",
                      m.role === "user"
                        ? "rounded-br-md bg-ink-700 text-mist-50"
                        : "rounded-bl-md border border-white/[0.07] bg-ink-900/70",
                    )}
                  >
                    {m.role === "user" ? (
                      <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      <div className="md" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
                    )}
                    <p
                      className={cn(
                        "mt-1 text-[10px]",
                        m.role === "user" ? "text-mist-400" : "text-mist-600",
                      )}
                    >
                      {new Date(m.at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {m.role === "assistant" && (
                      <button
                        onClick={() => {
                          void navigator.clipboard?.writeText(m.content);
                          setCopied(m.id);
                          window.setTimeout(() => setCopied((c) => (c === m.id ? null : c)), 1600);
                        }}
                        aria-label="Copiar respuesta"
                        className="absolute -top-2 right-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg border border-white/[0.1] bg-ink-850 text-mist-400 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:text-gold-300"
                      >
                        {copied === m.id ? <Check className="h-3 w-3 text-teal-300" /> : <Copy className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {busy && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5"
              >
                <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 text-ink-950">
                  <Bot className="h-4 w-4" />
                </span>
                <span className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-white/[0.07] bg-ink-900/70 px-3.5 py-3 text-mist-400">
                  <span className="dot-typing flex items-center gap-1">
                    <span />
                    <span />
                    <span />
                  </span>
                  <span className="text-[12px]">Revisando tu calendario…</span>
                </span>
              </motion.div>
            )}
          </div>

          {/* compositor */}
          <div className="border-t border-white/[0.06] bg-ink-900/40 p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={areaRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(140, e.target.scrollHeight)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                placeholder="Pregúntale algo de tus materias, un plan de repaso o que te examine…"
                className="max-h-[140px] min-h-[44px] flex-1 resize-none rounded-xl border border-white/[0.09] bg-ink-900/70 px-3.5 py-3 text-[13.5px] leading-relaxed text-mist-50 placeholder:text-mist-500 outline-none transition-all duration-200 focus:border-gold-400/60 focus:ring-4 focus:ring-gold-400/10 scroll-thin"
              />
              <button
                onClick={() => void send(input)}
                disabled={!input.trim() || busy}
                aria-label="Enviar mensaje"
                className={cn(
                  "flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-all duration-200 active:scale-95",
                  input.trim() && !busy
                    ? "bg-gold-400 text-ink-950 shadow-[0_10px_28px_-14px_rgba(242,169,59,0.95)] hover:bg-gold-300"
                    : "cursor-not-allowed bg-white/[0.05] text-mist-600",
                )}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 px-1 text-[10.5px] text-mist-600">
              Enter para enviar · Mayús + Enter para salto de línea · el tutor recibe tu contexto de estudio, no tus notas
              del diario
            </p>
          </div>
        </div>

        {/* rail lateral */}
        <aside className="space-y-4 p-4">
          <div className="rounded-2xl border border-white/[0.07] bg-ink-900/50 p-3.5">
            <p className="flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.12em] text-mist-500 uppercase">
              <CalendarClock className="h-3.5 w-3.5 text-peri-400" />
              Lo que sabe de ti
            </p>
            <ul className="mt-2.5 space-y-2 text-[12px]">
              <li className="flex items-baseline justify-between gap-2">
                <span className="text-mist-500">Materias</span>
                <span className="num text-right text-mist-200">{ctx.subjects.length || 0}</span>
              </li>
              <li className="flex items-baseline justify-between gap-2">
                <span className="text-mist-500">Estudio 7 d</span>
                <span className="num text-right text-mist-200">{fmtMinutes(ctx.weekMinutes)}</span>
              </li>
              <li className="flex items-baseline justify-between gap-2">
                <span className="text-mist-500">Hábitos</span>
                <span className="num text-right text-mist-200">{ctx.habits.length}</span>
              </li>
            </ul>
            {ctx.nextExam && (
              <p className="mt-3 rounded-xl border border-coral-400/20 bg-coral-400/[0.07] px-3 py-2 text-[11.5px] leading-snug text-mist-300">
                <strong className="text-mist-50">{ctx.nextExam.title}</strong>
                <br />
                {ctx.nextExam.subject} · en {ctx.nextExam.days} días
              </p>
            )}
          </div>

          <div>
            <p className="mb-2 text-[10.5px] font-semibold tracking-[0.12em] text-mist-500 uppercase">Sugerencias</p>
            <div className="space-y-1.5">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  onClick={() => void send(s.prompt)}
                  disabled={busy}
                  className="group flex w-full cursor-pointer items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-gold-400/40 hover:bg-white/[0.05] disabled:pointer-events-none disabled:opacity-50"
                >
                  <Sparkles className="h-3 w-3 shrink-0 text-gold-400 transition-transform duration-300 group-hover:scale-125" />
                  <span className="text-[11.5px] leading-snug text-mist-300 transition-colors group-hover:text-mist-100">
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.12em] text-mist-500 uppercase">
              <History className="h-3 w-3" />
              Conversaciones
            </p>
            <ul className="space-y-1">
              {threads.slice(0, 6).map((t) => (
                <li key={t.id}>
                  <div
                    className={cn(
                      "group flex items-center gap-1 rounded-lg px-2 py-1.5 transition-colors",
                      t.id === activeId ? "bg-white/[0.07]" : "hover:bg-white/[0.04]",
                    )}
                  >
                    <button
                      onClick={() => setActiveId(t.id)}
                      className="min-w-0 flex-1 cursor-pointer text-left"
                    >
                      <span
                        className={cn(
                          "block truncate text-[11.5px]",
                          t.id === activeId ? "text-mist-100" : "text-mist-400",
                        )}
                      >
                        {t.title}
                      </span>
                      <span className="block text-[10px] text-mist-600">
                        {new Date(t.updatedAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} ·{" "}
                        {t.messages.filter((m) => !m.hidden).length} msgs
                      </span>
                    </button>
                    <IconBtn
                      label="Eliminar conversación"
                      className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100 hover:border-coral-400/50 hover:bg-coral-400/10 hover:text-coral-400"
                      onClick={() => removeThread(t.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </IconBtn>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </Panel>
  );
}
