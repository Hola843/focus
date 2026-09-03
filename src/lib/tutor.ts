import { fmtMinutes } from "./core";

/* --------------------------------- tipos ---------------------------------- */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: string;
  /** Mensajes de contexto: se envían al modelo pero no se pintan. */
  hidden?: boolean;
}

export interface Thread {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface TutorContext {
  subjects: string[];
  nextExam: { title: string; subject: string; days: number; place: string } | null;
  weekMinutes: number;
  recentSessions: { subject: string; minutes: number }[];
  habits: { name: string; streak: number }[];
  pendingTodos: number;
}

const KEY = "estela.tutor.v1";
const uid = () => Math.random().toString(36).slice(2, 10);

/* --------------------------- backend (Express) ----------------------------- */

const env =
  (import.meta as unknown as { env?: Record<string, string | boolean | undefined> }).env ?? {};

/**
 * Desarrollo  → servidor Express local en http://localhost:3000
 * Producción  → mismo origen (el propio Express sirve dist/), salvo VITE_API_URL
 */
export const API_BASE =
  (typeof env.VITE_API_URL === "string" && env.VITE_API_URL.replace(/\/+$/, "")) ||
  (env.DEV ? "http://localhost:3000" : "");

export const CHAT_ENDPOINT = `${API_BASE}/api/chat`;
export const HEALTH_ENDPOINT = `${API_BASE}/api/health`;

/* ------------------------------- contexto --------------------------------- */

export function contextMessage(ctx: TutorContext): ChatMessage {
  const lines = [
    "CONTEXTO REAL DEL USUARIO (app Estela, datos actuales):",
    `- Materias: ${ctx.subjects.length ? ctx.subjects.join(", ") : "aún no ha creado ninguna"}.`,
    ctx.nextExam
      ? `- Próximo examen: «${ctx.nextExam.title}» de ${ctx.nextExam.subject}, en ${ctx.nextExam.days} ${ctx.nextExam.days === 1 ? "día" : "días"} (${ctx.nextExam.place || "lugar sin confirmar"}).`
      : "- No tiene exámenes programados.",
    `- Estudio de los últimos 7 días: ${fmtMinutes(ctx.weekMinutes)}.`,
    ctx.recentSessions.length
      ? `- Últimas sesiones: ${ctx.recentSessions.map((s) => `${s.subject} ${s.minutes} min`).join("; ")}.`
      : "- Todavía no ha registrado sesiones.",
    ctx.habits.length
      ? `- Hábitos y racha actual: ${ctx.habits.map((h) => `${h.name} (${h.streak} d)`).join(", ")}.`
      : "- Aún no tiene hábitos definidos.",
    `- Pequeñas tareas pendientes hoy: ${ctx.pendingTodos}.`,
    "Usa estos datos para personalizar planes de repaso, ejemplos y consejos. Si falta información, pregúntala.",
  ];
  return { id: `ctx-${uid()}`, role: "user", content: lines.join("\n"), at: new Date().toISOString(), hidden: true };
}

/* ------------------------------ conversación ------------------------------ */

export function newThread(ctx?: TutorContext): Thread {
  return {
    id: uid(),
    title: "Nueva conversación",
    updatedAt: new Date().toISOString(),
    messages: ctx ? [contextMessage(ctx)] : [],
  };
}

export function loadThreads(): Thread[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Thread[];
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function saveThreads(threads: Thread[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(threads.slice(0, 25)));
  } catch {
    /* ignore */
  }
}

/** Llama al endpoint serverless (api/chat.js). Si no existe, cae al tutor local. */
export async function askTutor(
  messages: ChatMessage[],
  ctx: TutorContext,
  question: string,
): Promise<{ reply: string; online: boolean }> {
  const payload = {
    messages: messages
      .filter((m) => m.content.trim())
      .map((m) => ({ role: m.role, content: m.content })),
  };

  try {
    const res = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Si el servidor devuelve HTML (p. ej. un 404 de un hosting estático) no es nuestro backend.
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("application/json")) throw new Error(`Respuesta no JSON (${res.status})`);

    const data = (await res.json()) as { reply?: string; error?: string };
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
    if (!data.reply) throw new Error("Respuesta vacía");

    return { reply: data.reply, online: true };
  } catch (err) {
    console.warn("[tutor] backend no disponible, usando modo local:", (err as Error)?.message ?? err);
    await new Promise((r) => setTimeout(r, 380));
    return { reply: offlineReply(question, ctx), online: false };
  }
}

/* --------------------------- tutor local (offline) ------------------------ */

export function offlineReply(question: string, ctx: TutorContext): string {
  const q = question.toLowerCase();
  const exam = ctx.nextExam;
  const subject = exam?.subject ?? ctx.subjects[0] ?? "tu materia";
  const local =
    "> *Modo local: no he podido conectar con el servidor Express (`POST /api/chat`). Arráncalo con `node server/index.js` y comprueba `GEMINI_API_KEY` en el archivo `.env`. Mientras tanto te ayudo con lo que sé de tu calendario.*\n\n";

  if (/plan|repaso|organiz|cronograma|calendario/.test(q)) {
    if (!exam)
      return `${local}No tienes exámenes a la vista. Dime qué materia quieres preparar y te monto un plan por semanas con sesiones de ${Math.max(25, Math.round(ctx.weekMinutes / 7 / 25) || 25)} minutos.`;
    const days = Math.max(1, exam.days);
    const blocks = days >= 7 ? 4 : days >= 3 ? 3 : 2;
    return `${local}### Plan de repaso para «${exam.title}»
Quedan **${days} ${days === 1 ? "día" : "días"}**, así que vamos a repartirlo en ${blocks} bloques:

1. **Bloque 1 · Diagnóstico** — lista los temas que entran y puntúate del 1 al 5 en cada uno. Empieza por los que tengan menos de 3.
2. **Bloque 2 · Comprensión** — ${subject}: relee solo lo flojo y explícalo en voz alta sin mirar (si te trabas, ahí está el hueco).
3. **Bloque 3 · Práctica** — ejercicios y preguntas de examen cronometradas, sin apuntes.
4. **Bloque 4 · Simulacro** — un examen entero en condiciones reales y revisión de errores el día antes.

Llevas ${fmtMinutes(ctx.weekMinutes)} esta semana: reserva dos bloques de 50 minutos al día y deja el último día solo para repasar fallos.`;
  }

  if (/examen|pregunta|test|simulacro|evalua/.test(q)) {
    return `${local}### Examen de prueba · ${subject}
Responde sin mirar nada y luego te lo corrijo:

1. Define con tus palabras el concepto central del último tema que has estudiado.
2. Pon un ejemplo propio (no el del libro) y explica por qué funciona.
3. ¿Qué error típico se comete al aplicarlo?
4. Relaciona ese concepto con otro tema de ${subject}.
5. Resuelve un caso práctico en 5 minutos cronometrados.

Cuando me pases tus respuestas, te digo dónde está flojo el razonamiento.`;
  }

  if (/pomodoro|técnica|tecnica|concentr|distra|foco/.test(q)) {
    return `${local}### Foco en cuatro pasos
1. **Elige una sola tarea** concreta («ejercicios 12 a 18», no «estudiar Cálculo»).
2. **Bloque de 25-50 minutos** con el móvil en otra habitación y una hoja al lado para apuntar lo que te distraiga.
3. **Pausa real de 5 minutos**: levántate, agua, ventana. Nada de redes.
4. **Cierre de 2 minutos**: escribe qué has avanzado y cuál es el siguiente paso exacto.

Cada cuatro bloques, descanso largo de 15. En Estela tienes el temporizador en la sección de Estudio: arranca la sesión desde una de tus sesiones planificadas para que cuente sola.`;
  }

  if (/resumen|resume|semana|cómo voy|como voy|balance/.test(q)) {
    const best = [...ctx.recentSessions].sort((a, b) => b.minutes - a.minutes)[0];
    return `${local}### Tu semana en datos
- **Estudio total:** ${fmtMinutes(ctx.weekMinutes)} en los últimos 7 días.
- **Sesiones registradas:** ${ctx.recentSessions.length || 0}${best ? `, la más larga de ${best.minutes} min en ${best.subject}` : ""}.
- **Hábitos activos:** ${ctx.habits.length ? ctx.habits.map((h) => `${h.name} (racha ${h.streak} d)`).join(", ") : "ninguno todavía"}.
- **Pequeñas tareas pendientes:** ${ctx.pendingTodos}.
${exam ? `\nCon «${exam.title}» en ${exam.days} días, prioriza ${exam.subject} en los próximos bloques.` : "\nSin exámenes cerca: buen momento para adelantar temario."}`;
  }

  if (/memoriz|recordar|olvid|reten/.test(q)) {
    return `${local}### Memorizar sin releer
- **Recuerdo activo**: cierra el libro y escribe todo lo que recuerdes; después compara. Duele más y fija el doble.
- **Repetición espaciada**: repasa a las 24 h, a los 3 días y a la semana.
- **Tarjetas de una idea**: una pregunta por tarjeta, respuesta corta.
- **Enséñalo**: explica el tema en voz alta como si quien escucha no supiera nada.
- **Duerme**: lo que estudias 1-2 h antes de dormir se consolida mejor.

Con ${ctx.habits.length ? `tus hábitos actuales (${ctx.habits.map((h) => h.name).join(", ")})` : "un hábito nuevo de repaso diario"} tienes el anclaje perfecto para la repetición espaciada.`;
  }

  if (/nervios|ansiedad|estrés|estres|miedo|bloqueo/.test(q)) {
    return `${local}### Bajar los nervios antes del examen
1. **Respira 4-7-8** dos minutos antes de entrar: inspira 4, aguanta 7, suelta 8.
2. **Vuelca en sucio**: al recibir el examen, anota fórmulas y fechas clave antes de leer las preguntas.
3. **Empieza por lo que sabes** para ganar confianza y tiempo.
4. **Bloqueo puntual**: pasa a otra pregunta y vuelve; el cerebro sigue trabajando en segundo plano.
5. **La noche anterior no se estudia nuevo**: solo repaso ligero y dormir.`;
  }

  return `${local}Soy el tutor de estudio de Estela. Ahora mismo trabajo con lo que hay en tu app:

- ${ctx.subjects.length ? `Tus materias: **${ctx.subjects.join(", ")}` : "Aún no tienes materias creadas"}**
- ${exam ? `Próximo examen: **${exam.title}** (${exam.subject}) en ${exam.days} días` : "Sin exámenes programados"}
- ${fmtMinutes(ctx.weekMinutes)} de estudio en los últimos 7 días

Puedo montarte un **plan de repaso**, hacerte un **examen de prueba**, explicarte una **técnica de estudio**, resumir **tu semana** o darte pautas para **memorizar** y para los **nervios**. ¿Por dónde empezamos?`;
}

/* ------------------------------ sugerencias -------------------------------- */

export function suggestionsFor(ctx: TutorContext): { label: string; prompt: string }[] {
  const exam = ctx.nextExam;
  const subject = exam?.subject ?? ctx.subjects[0] ?? "mi materia";
  return [
    exam
      ? { label: `Plan de repaso para ${exam.title}`, prompt: `Hazme un plan de repaso día a día para ${exam.title} de ${exam.subject}. Quedan ${exam.days} días.` }
      : { label: "Plan de estudio semanal", prompt: "Montame un plan de estudio semanal realista con mis materias." },
    { label: `Examen de prueba de ${subject}`, prompt: `Hazme 5 preguntas tipo examen de ${subject} y luego corrígeme.` },
    { label: "Técnica para memorizar", prompt: "¿Qué técnica uso para memorizar temario denso y no olvidarlo?" },
    { label: "Resumen de mi semana", prompt: "Resume mi semana de estudio con mis datos y dime qué mejorar." },
  ];
}

/* ------------------------------- markdown ---------------------------------- */

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Markdown mínimo y seguro: primero se escapa todo, luego se formatea. */
export function renderMarkdown(src: string): string {
  const blocks: string[] = [];
  let text = src.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_m, _lang, code) => {
    blocks.push(`<pre><code>${escapeHtml(String(code).replace(/\n$/, ""))}</code></pre>`);
    return `\u0000${blocks.length - 1}\u0000`;
  });

  text = escapeHtml(text);

  const inline = (s: string) =>
    s
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");

  const lines = text.split("\n");
  const out: string[] = [];
  let list: "ul" | "ol" | null = null;

  const closeList = () => {
    if (list) {
      out.push(`</${list}>`);
      list = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const ordered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const heading = /^#{1,4}\s+(.*)$/.exec(line);
    const quote = /^>\s?(.*)$/.exec(line);

    if (bullet) {
      if (list !== "ul") {
        closeList();
        out.push("<ul>");
        list = "ul";
      }
      out.push(`<li>${inline(bullet[1])}</li>`);
    } else if (ordered) {
      if (list !== "ol") {
        closeList();
        out.push("<ol>");
        list = "ol";
      }
      out.push(`<li>${inline(ordered[1])}</li>`);
    } else {
      closeList();
      if (heading) out.push(`<h4>${inline(heading[1])}</h4>`);
      else if (quote) out.push(`<p class="md-quote">${inline(quote[1])}</p>`);
      else if (!line.trim()) out.push("");
      else out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();

  return out
    .join("\n")
    .replace(/\u0000(\d+)\u0000/g, (_m, i) => blocks[Number(i)] ?? "")
    .replace(/<p>\s*<\/p>/g, "");
}
