import { Check, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { TODAY, fmtMinutes, subjectIcon } from "../lib/core";
import { useStore } from "../lib/store";
import { useUI } from "../lib/ui-state";
import { cn } from "../utils/cn";
import { Button, Field, Modal, inputCls, useToast } from "./ui";

const PRESETS = [15, 25, 45, 50, 60, 90];

export function SessionModal() {
  const { sessionModal, closeSession } = useUI();
  const { subjects, addSession } = useStore();
  const toast = useToast();
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [minutes, setMinutes] = useState("25");
  const [date, setDate] = useState(TODAY);
  const [note, setNote] = useState("");
  const [type, setType] = useState<"pomodoro" | "libre">("pomodoro");

  useEffect(() => {
    if (!sessionModal) return;
    setSubjectId(subjects[0]?.id ?? "");
    setMinutes("25");
    setDate(TODAY);
    setNote("");
    setType("pomodoro");
  }, [sessionModal, subjects]);

  const save = () => {
    const value = Number(minutes.replace(",", "."));
    if (!subjectId) return toast({ title: "Elige una materia", tone: "warn" });
    if (Number.isNaN(value) || value <= 0 || value > 480)
      return toast({ title: "Duración no válida", desc: "Entre 1 y 480 minutos.", tone: "warn" });
    addSession({ date, subjectId, minutes: Math.round(value), type, note: note.trim() || "Sesión de estudio" });
    toast({
      title: "Sesión registrada",
      desc: `${fmtMinutes(value)} en ${subjects.find((s) => s.id === subjectId)?.name ?? ""}`,
      tone: "ok",
    });
    closeSession();
  };

  return (
    <Modal
      open={sessionModal}
      onClose={closeSession}
      title="Registrar sesión de estudio"
      subtitle="Cada bloque suma: apunta lo que has estudiado"
      footer={
        <>
          <Button variant="ghost" onClick={closeSession}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={save}>
            <Check className="h-4 w-4" />
            Guardar sesión
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <span className="mb-2 block text-[11.5px] font-semibold tracking-[0.08em] text-mist-400 uppercase">Materia</span>
          <div className="flex flex-wrap gap-1.5">
            {subjects.map((s) => {
              const Icon = subjectIcon(s.icon);
              const active = subjectId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSubjectId(s.id)}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12.5px] transition-all duration-200 active:scale-95",
                    active ? "text-ink-950" : "border-white/[0.09] bg-white/[0.03] text-mist-300 hover:border-white/25",
                  )}
                  style={active ? { background: s.color, borderColor: s.color } : undefined}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Duración" hint="minutos">
            <div className="relative">
              <input
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                inputMode="numeric"
                className={cn(inputCls, "num no-spin pr-10 text-[18px] font-semibold")}
              />
              <Clock3 className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-mist-500" />
            </div>
          </Field>
          <Field label="Fecha">
            <input type="date" max={TODAY} value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </Field>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => {
                setMinutes(String(p));
                setType(p === 25 || p === 50 ? "pomodoro" : "libre");
              }}
              className="cursor-pointer rounded-lg border border-white/[0.09] px-2.5 py-1 text-[12px] text-mist-400 transition-colors hover:border-gold-400/40 hover:text-gold-300"
            >
              {p} min
            </button>
          ))}
        </div>

        <div className="flex gap-2 rounded-xl border border-white/[0.08] bg-ink-900/60 p-1.5">
          {(["pomodoro", "libre"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                "flex-1 cursor-pointer rounded-lg py-2 text-[12.5px] font-medium transition-all duration-200",
                type === t ? "bg-white/[0.09] text-mist-50" : "text-mist-400 hover:text-mist-200",
              )}
            >
              {t === "pomodoro" ? "Bloque tipo pomodoro" : "Estudio libre"}
            </button>
          ))}
        </div>

        <Field label="Qué has trabajado" hint="opcional">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Ejercicios del tema 4, repasos con tarjetas…"
            className={cn(inputCls, "resize-none")}
          />
        </Field>
      </div>
    </Modal>
  );
}
