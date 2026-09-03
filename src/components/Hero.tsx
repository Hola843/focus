import { motion } from "framer-motion";
import { BookOpen, CalendarCheck, ChevronRight, ImagePlus, ListChecks, ListTodo, NotebookPen, Pencil, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TODAY, fmtHours, longDate } from "../lib/core";
import { useStore } from "../lib/store";
import { useTodos } from "../lib/todos";
import { useUI, type View } from "../lib/ui-state";
import { useToast } from "./ui";

const KEY = "estela.hero.v1";

const COLUMNS: { id: string; label: string; goal: string; view: View; icon: typeof BookOpen }[] = [
  { id: "habitos", label: "Hábitos", goal: "Constancia diaria", view: "habitos", icon: CalendarCheck },
  { id: "estudio", label: "Estudio", goal: "Aprobar con margen", view: "estudio", icon: BookOpen },
  { id: "tareas", label: "Tareas", goal: "Llegar a todo", view: "tareas", icon: ListTodo },
  { id: "diario", label: "Diario", goal: "Escribir cada día", view: "diario", icon: NotebookPen },
  { id: "progreso", label: "Progreso", goal: "Medir y mejorar", view: "progreso", icon: TrendingUp },
];

async function compress(file: File, max = 1400): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function Hero() {
  const { setView } = useUI();
  const { habits, logs, weekMinutes, gratitudeStreak } = useStore();
  const { todos, doneCount } = useTodos();
  const toast = useToast();

  const [photo, setPhoto] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setPhoto(localStorage.getItem(KEY) ?? "");
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    const clear = () => setPhoto("");
    window.addEventListener("estela:reset", clear);
    return () => window.removeEventListener("estela:reset", clear);
  }, []);

  const onFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Eso no es una imagen", desc: "Elige un JPG o PNG de tu dispositivo.", tone: "warn" });
      return;
    }
    const dataUrl = await compress(file);
    setPhoto(dataUrl);
    try {
      localStorage.setItem(KEY, dataUrl);
      toast({ title: "Foto del templo colocada", desc: "Tócala cuando quieras cambiarla.", tone: "ok" });
    } catch {
      toast({ title: "No se pudo guardar", desc: "Prueba con una imagen más ligera.", tone: "warn" });
    }
  };

  const habitsDone = habits.filter((h) => (logs[h.id] ?? []).includes(TODAY)).length;

  return (
    <section className="relative pb-2">
      {/* resplandor cálido tras el templo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[420px] max-w-4xl rounded-full opacity-70 blur-[100px]"
        style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(242,169,59,0.18), transparent 70%)" }}
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {/* encabezado */}
      <div className="relative flex flex-wrap items-end justify-between gap-x-8 gap-y-4 px-1">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-mist-500 uppercase">
            <span className="pulse-ring h-1.5 w-1.5 rounded-full bg-gold-400" />
            El templo · {longDate(TODAY)}
          </p>
          <h2 className="font-display mt-3 text-[30px] leading-[1.02] font-extrabold tracking-tight text-mist-50 sm:text-[42px]">
            Tus objetivos,
            <span className="block font-semibold text-mist-400">sostenidos por tu esfuerzo diario.</span>
          </h2>
          <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-mist-400">
            Cinco pilares aguantan una sola imagen: la que te recuerda por qué haces todo esto. Toca la foto para
            ponerla, y toca un pilar para entrar en esa parte de tu vida.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Stat label="Foto del templo" value={photo ? "Colocada" : "Pendiente"} accent={!!photo} />
          <Stat label="Hábitos hoy" value={`${habitsDone}/${habits.length || 0}`} />
          <Stat label="Estudio (7 d)" value={fmtHours(weekMinutes)} />
          <Stat label="Lista rápida" value={`${doneCount}/${todos.length}`} />
          <Stat label="Racha gratitud" value={`${gratitudeStreak} d`} />
        </div>
      </div>

      {/* fachada */}
      <div className="relative mx-auto mt-8 max-w-5xl px-1">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* remate superior */}
          <div className="h-[10px] rounded-t-[5px] bg-gradient-to-b from-[#f8f1df] via-[#ddcfae] to-[#9b8e70] shadow-[0_-2px_10px_rgba(0,0,0,0.5)]" />
          <div className="h-[3px] bg-gradient-to-r from-gold-500/20 via-gold-300 to-gold-500/20 opacity-70" />

          {/* LA FOTO GRANDE */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label={photo ? "Cambiar la foto del templo" : "Subir la foto del templo"}
            className="group relative block w-full cursor-pointer overflow-hidden bg-ink-900/85 text-left"
          >
            {loaded && photo ? (
              <motion.img
                src={photo}
                alt="La imagen que sostiene tus objetivos"
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="h-[210px] w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.035] sm:h-[300px] lg:h-[380px]"
              />
            ) : (
              <span className="relative flex h-[210px] w-full flex-col items-center justify-center gap-3 px-6 sm:h-[300px] lg:h-[380px]">
                <span
                  aria-hidden
                  className="absolute inset-4 rounded-[10px] border border-dashed border-gold-400/25"
                  style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(242,169,59,0.07), transparent 70%)" }}
                />
                <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-gold-400/40 bg-gold-400/[0.07] text-gold-400 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105">
                  <ImagePlus className="h-7 w-7" />
                </span>
                <span className="relative font-display text-[17px] font-semibold text-mist-100 transition-colors duration-300 group-hover:text-gold-300">
                  Sube la foto que sostiene todo esto
                </span>
                <span className="relative max-w-md text-center text-[12.5px] leading-relaxed text-mist-500">
                  Una sola imagen grande para el templo: tu meta, tu sitio favorito, tu gente. Se guarda en tu
                  dispositivo y puedes cambiarla cuando quieras.
                </span>
              </span>
            )}

            {/* veladuras y marco interior */}
            <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/75 via-transparent to-ink-950/35" />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 border-[3px] border-[#cbbd9b]/25 transition-colors duration-500 group-hover:border-gold-300/50"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0 shadow-[inset_0_0_80px_rgba(242,169,59,0.28)] transition-opacity duration-500 group-hover:opacity-100"
            />

            {/* acción */}
            <span className="pointer-events-none absolute top-3 right-3 flex translate-y-[-6px] items-center gap-1.5 rounded-full border border-gold-300/40 bg-ink-950/80 px-3 py-1.5 text-[11px] font-medium tracking-[0.06em] text-gold-300 uppercase opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <Pencil className="h-3 w-3" />
              {photo ? "Cambiar foto" : "Elegir foto"}
            </span>

            {photo && (
              <span className="pointer-events-none absolute bottom-3 left-4 flex items-center gap-2 text-[11px] tracking-[0.14em] text-mist-200/80 uppercase">
                <span className="h-px w-8 bg-gold-300/70" />
                Tu porqué
              </span>
            )}
          </button>

          {/* entablamento */}
          <div className="h-[10px] bg-gradient-to-b from-[#f0e7d3] to-[#a89b7d]" />
          <div
            className="h-[12px] bg-[#221f1a]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, #e4d9bc 0 9px, transparent 9px 22px), linear-gradient(to bottom, rgba(255,255,255,0.08), transparent)",
            }}
          />
          <div className="h-[7px] bg-gradient-to-b from-[#d3c7a8] to-[#6f6650] shadow-[0_4px_10px_rgba(0,0,0,0.55)]" />
        </motion.div>

        {/* columnas */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.25 } } }}
          className="grid grid-cols-2 items-end gap-x-3 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-5"
        >
          {COLUMNS.map((c) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.id}
                variants={{
                  hidden: { opacity: 0, y: 22 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
                }}
                role="button"
                tabIndex={0}
                aria-label={`Ir a ${c.label}`}
                onClick={() => setView(c.view)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setView(c.view);
                  }
                }}
                className="group relative flex cursor-pointer flex-col items-center outline-none"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-1 top-2 bottom-14 rounded-[20px] bg-gold-400/0 blur-2xl transition-all duration-500 group-hover:bg-gold-400/25 group-focus-visible:bg-gold-400/25"
                />

                {/* capitel */}
                <span className="relative z-10 h-[9px] w-[92%] rounded-t-[3px] bg-gradient-to-b from-[#f7f0de] via-[#dccfae] to-[#9b8e70] transition-transform duration-300 group-hover:-translate-y-[2px]" />
                <span className="relative z-10 h-[6px] w-[78%] rounded-b-[6px] bg-gradient-to-b from-[#efe6d2] to-[#b0a385] shadow-[0_3px_6px_rgba(0,0,0,0.5)]" />

                {/* fuste estriado */}
                <span
                  className="relative z-10 h-[92px] w-[66%] overflow-hidden sm:h-[112px] sm:w-[60%] lg:h-[132px]"
                  style={{ clipPath: "polygon(11% 0, 89% 0, 100% 100%, 0 100%)" }}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-[#4a473f] via-[#ece4d2] to-[#3d3b35]" />
                  <span
                    className="absolute inset-0 opacity-45"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(90deg, rgba(0,0,0,0.34) 0 1.5px, rgba(255,255,255,0.18) 1.5px 3px, transparent 3px 10px)",
                    }}
                  />
                  <span className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/35" />
                  <span className="absolute inset-0 bg-gold-400/0 transition-colors duration-500 group-hover:bg-gold-400/15" />
                </span>

                {/* basa */}
                <span className="relative z-10 h-[9px] w-[76%] bg-gradient-to-b from-[#f0e7d3] to-[#a89b7d]" />
                <span className="relative z-10 h-[7px] w-[90%] bg-gradient-to-b from-[#d7cba9] to-[#7a7055] shadow-[0_4px_10px_rgba(0,0,0,0.6)]" />

                {/* nombre */}
                <span className="relative z-10 mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-mist-100 transition-colors duration-300 group-hover:text-gold-300">
                  <Icon className="h-3.5 w-3.5 transition-colors duration-300 group-hover:text-gold-400" />
                  {c.label}
                  <ChevronRight className="h-3 w-3 -translate-x-1 text-gold-400 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                </span>
                <span className="relative z-10 mt-0.5 text-center text-[10.5px] leading-tight text-mist-600 transition-colors duration-300 group-hover:text-mist-400">
                  {c.goal}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* estilóbato */}
        <div className="relative mt-1">
          <div className="h-[9px] rounded-[2px] bg-gradient-to-b from-[#efe6d0] to-[#8e8468]" />
          <div className="mx-auto -mt-[1px] h-[11px] w-[95%] bg-gradient-to-b from-[#dbd0b2] to-[#736a51]" />
          <div className="mx-auto -mt-[1px] h-[13px] w-[90%] rounded-b-[3px] bg-gradient-to-b from-[#c6ba9c] to-[#564f3c]" />
          <div className="mx-auto h-8 w-[78%] rounded-b-full bg-black/45 blur-lg" />
        </div>

        <p className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-[11.5px] text-mist-600">
          <span className="inline-flex items-center gap-1.5">
            <ImagePlus className="h-3 w-3" /> toca la foto para subirla o cambiarla
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ListChecks className="h-3 w-3" /> toca un pilar para entrar en esa sección
          </span>
        </p>
      </div>
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-ink-900/50 px-3 py-2 backdrop-blur-[2px] transition-colors duration-300 hover:border-gold-400/30">
      <p className="text-[9.5px] tracking-[0.12em] text-mist-500 uppercase">{label}</p>
      <p className={`num mt-0.5 text-[15px] font-semibold ${accent ? "text-teal-300" : "text-mist-50"}`}>{value}</p>
    </div>
  );
}
