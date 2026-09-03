/**
 * Backend de Estela · tutor de estudio con Gemini.
 *
 *   node server/index.js          → http://localhost:3000
 *
 * Variables (archivo .env en la raíz, ver .env.example):
 *   GEMINI_API_KEY   obligatoria
 *   PORT             opcional (3000 por defecto)
 *   GEMINI_MODEL     opcional (gemini-2.5-flash por defecto)
 *   CLIENT_ORIGIN    opcional, origen del frontend para CORS en desarrollo
 */

import "dotenv/config";

import path from "node:path";
import { fileURLToPath } from "node:url";

import cors from "cors";
import express from "express";
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const PORT = Number(process.env.PORT) || 3000;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = [
  "Eres el tutor de estudio integrado en la app Estela.",
  "Ayudas al usuario a resolver dudas sobre exámenes y temario de forma clara, con ejemplos y explicaciones paso a paso.",
  "No te limites a dar la respuesta final si el usuario está aprendiendo un concepto: guíalo.",
  "El usuario te enviará al principio un bloque CONTEXTO REAL con sus materias, exámenes y horas de estudio; úsalo para personalizar planes y ejemplos.",
  "Responde siempre en español, en markdown ligero (listas y negritas), de forma breve y directa salvo que pida más detalle.",
].join(" ");

/* --------------------------------- cliente -------------------------------- */

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

/* --------------------------- límite de peticiones -------------------------- */
/** Cubo de tokens simple por IP: 20 peticiones/minuto. */
const WINDOW_MS = 60_000;
const LIMIT = 20;
const hits = new Map();

function rateLimit(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "desconocida";
  const bucket = hits.get(key);

  if (!bucket || now > bucket.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  bucket.count += 1;
  if (bucket.count > LIMIT) {
    res.set("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
    return res.status(429).json({ error: "Demasiadas peticiones. Espera un minuto." });
  }
  return next();
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of hits) if (now > bucket.resetAt) hits.delete(key);
}, WINDOW_MS).unref?.();

/* ------------------------------- validación ------------------------------- */

const MAX_MESSAGES = 40;
const MAX_CHARS = 12_000;

function normalize(body) {
  const { messages } = body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return { error: "Falta el array 'messages' con al menos un mensaje." };
  }
  if (messages.length > MAX_MESSAGES) {
    return { error: `Demasiados mensajes (máximo ${MAX_MESSAGES}).` };
  }

  const contents = [];
  let chars = 0;

  for (const message of messages) {
    const text = typeof message?.content === "string" ? message.content.trim() : "";
    if (!text) continue;
    chars += text.length;
    if (chars > MAX_CHARS) return { error: `Conversación demasiado larga (máximo ${MAX_CHARS} caracteres).` };

    contents.push({
      // Gemini usa "user" | "model"
      role: message.role === "assistant" || message.role === "model" ? "model" : "user",
      parts: [{ text }],
    });
  }

  if (!contents.length) return { error: "Los mensajes están vacíos." };
  return { contents };
}

/* --------------------------------- servidor -------------------------------- */

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "256kb" }));
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(",").map((o) => o.trim()) : true,
    methods: ["GET", "POST"],
  }),
);
app.use(rateLimit);

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "estela-tutor",
    model: MODEL,
    keyConfigurada: Boolean(API_KEY),
    uptime: Math.round(process.uptime()),
  });
});

app.post("/api/chat", async (req, res) => {
  if (!API_KEY || !ai) {
    return res.status(500).json({
      error: "GEMINI_API_KEY no configurada. Crea un archivo .env a partir de .env.example.",
    });
  }

  const { contents, error } = normalize(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    const reply = (response.text || "").trim();
    if (!reply) return res.status(502).json({ error: "El modelo no ha devuelto texto." });

    return res.json({
      reply,
      model: MODEL,
      tokens: response.usageMetadata?.totalTokenCount ?? null,
    });
  } catch (err) {
    const status = err?.status ?? err?.response?.status;
    const message = err?.message || "Error desconocido";
    console.error("[/api/chat]", message);

    if (status === 401 || status === 403) {
      return res.status(500).json({ error: "Clave de Gemini rechazada. Revisa GEMINI_API_KEY." });
    }
    if (status === 429) {
      return res.status(429).json({ error: "Cuota de Gemini agotada. Inténtalo en unos minutos." });
    }
    return res.status(500).json({ error: "No se pudo contactar con Gemini." });
  }
});

/* --------------------- frontend compilado (producción) --------------------- */

const dist = path.join(ROOT, "dist");
app.use(express.static(dist, { extensions: ["html"] }));
app.get(/^\/(?!api\/).*/, (_req, res, next) => {
  res.sendFile(path.join(dist, "index.html"), (err) => err && next());
});

/* ------------------------------ manejo de fallos --------------------------- */

app.use((req, res) => res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` }));

app.use((err, _req, res, _next) => {
  console.error("[servidor]", err?.message ?? err);
  res.status(err?.type === "entity.too.large" ? 413 : 500).json({ error: "Error interno del servidor." });
});

app.listen(PORT, () => {
  const banner = [
    "",
    "  Estela · servidor del tutor",
    `  → http://localhost:${PORT}`,
    `  → POST http://localhost:${PORT}/api/chat`,
    `  → GET  http://localhost:${PORT}/api/health`,
    `  Modelo: ${MODEL}`,
    `  GEMINI_API_KEY: ${API_KEY ? "cargada ✓" : "FALTA (crea el archivo .env)"}`,
    "",
  ].join("\n");
  console.log(banner);
  if (!API_KEY) console.warn("  Copia .env.example a .env y añade tu clave.\n");
});
