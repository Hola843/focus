# Servidor del tutor (Node.js + Express + Gemini)

Backend mínimo que protege tu clave de Google y expone una única ruta para el
chatbot de la sección **Estudio**.

```
POST /api/chat     { messages: [{ role, content }] }  →  { reply, model, tokens }
GET  /api/health   →  { ok, service, model, keyConfigurada, uptime }
```

## 1. Instalación

```bash
npm install
```

Dependencias del servidor: `express`, `cors`, `dotenv` y `@google/genai`.

## 2. Clave de API de forma segura

```bash
cp .env.example .env
```

Edita `.env` y pega tu clave (<https://aistudio.google.com/app/apikey>):

```env
GEMINI_API_KEY=tu_clave_aqui
PORT=3000
GEMINI_MODEL=gemini-2.5-flash
```

- `dotenv` lo carga al arrancar con `import "dotenv/config"`.
- `.env` está en `.gitignore`: nunca llega al repositorio.
- La clave **solo** se usa dentro del servidor; el navegador jamás la ve.

## 3. Arrancar

```bash
# backend
node server/index.js          # http://localhost:3000

# frontend (otra terminal)
npm run dev                   # http://localhost:5173
```

El frontend llama automáticamente a `http://localhost:3000/api/chat` en
desarrollo. En producción usa el mismo origen, porque el propio Express sirve
la carpeta `dist/`:

```bash
npm run build
node server/index.js          # http://localhost:3000 sirve app + API
```

Para apuntar a otro backend, define `VITE_API_URL` en `.env` antes de compilar:

```env
VITE_API_URL=https://mi-dominio.com
```

## 4. Cómo se procesa una petición

1. `express.json()` parsea el cuerpo (límite 256 kB).
2. `normalize()` valida el array `messages` (máx. 40 mensajes / 12 000
   caracteres) y traduce los roles: `assistant` → `model`, que es lo que espera
   Gemini.
3. `ai.models.generateContent()` llama a `gemini-2.5-flash` con el historial y
   una `systemInstruction` que define al tutor.
4. Se devuelve `{ reply }`; los errores salen como 400 / 401 / 429 / 500 con un
   mensaje claro y sin filtrar la clave.

Incluye además un límite de **20 peticiones por minuto e IP** (cubo de tokens
en memoria) para que nadie te funda la cuota.

## 5. Prueba rápida

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"¿Cómo organizo un repaso de 3 días?"}]}'
```

## 6. Despliegue

- **VPS / Railway / Render:** `npm run build` y `node server/index.js` con
  `GEMINI_API_KEY` y `PORT` como variables de entorno del servicio.
- **Vercel (serverless):** el proyecto conserva `api/chat.js`, que acepta el
  mismo contrato. No necesitas arrancar Express; el frontend usa `/api/chat` en
  el mismo origen.

## Nota

Si el backend no está disponible, la app no se rompe: el tutor entra en *modo
local* y responde con un asistente que usa los datos reales de tu calendario.
