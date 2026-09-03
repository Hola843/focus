import { motion } from "framer-motion";
import { Award, Check, GraduationCap, Pencil, TrendingUp, X } from "lucide-react";
import { useState } from "react";
import { TODAY, countdown, relativeDay, shortDate } from "../lib/core";
import { useStore } from "../lib/store";
import { cn } from "../utils/cn";
import { Button, EmptyState, IconBtn, Panel, PanelHead, inputCls, useToast } from "./ui";

const gradeColor = (g: number) => (g >= 8 ? "#9fd356" : g >= 5 ? "#37c7b0" : "#ff7a6b");

export function GradesRecord() {
  const { exams, subjects, updateExam } = useStore();
  const toast = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const graded = exams.filter((e) => typeof e.grade === "number");
  const pending = exams.filter((e) => e.date < TODAY && (e.grade === null || e.grade === undefined));
  const upcoming = exams.filter((e) => e.date >= TODAY);
  const avg = graded.length ? graded.reduce((s, e) => s + (e.grade ?? 0), 0) / graded.length : 0;
  const passed = graded.filter((e) => (e.grade ?? 0) >= 5).length;
  const best = graded.length ? Math.max(...graded.map((e) => e.grade ?? 0)) : 0;

  const rows = [
    ...pending,
    ...[...graded].sort((a, b) => (a.date < b.date ? 1 : -1)),
    ...upcoming,
  ];

  const saveGrade = (id: string) => {
    const value = Number(draft.replace(",", "."));
    if (Number.isNaN(value) || value < 0 || value > 10) {
      toast({ title: "Nota no válida", desc: "Debe estar entre 0 y 10.", tone: "warn" });
      return;
    }
    const exam = exams.find((e) => e.id === id);
    if (!exam) return;
    updateExam({ ...exam, grade: Math.round(value * 100) / 100 });
    toast({
      title: value >= 5 ? "Aprobado registrado" : "Nota registrada",
      desc: `${exam.title} · ${value.toLocaleString("es-ES")}`,
      tone: value >= 5 ? "ok" : "warn",
    });
    setEditingId(null);
    setDraft("");
  };

  return (
    <Panel glow="#9fd356">
      <PanelHead
        title="Registro de notas"
        hint="Apunta el resultado de cada examen y sigue tu evolución"
        action={
          <div className="hidden items-center gap-4 text-[11.5px] text-mist-500 sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-teal-400" />
              media <strong className="num text-mist-100">{graded.length ? avg.toLocaleString("es-ES", { minimumFractionDigits: 1 }) : "—"}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-sage-400" />
              mejor <strong className="num text-mist-100">{best ? best.toLocaleString("es-ES") : "—"}</strong>
            </span>
          </div>
        }
      />

      {/* resumen */}
      <div className="grid grid-cols-2 divide-white/[0.06] border-b border-white/[0.06] sm:grid-cols-4 sm:divide-x">
        <Stat label="Exámenes" value={String(exams.length)} />
        <Stat label="Con nota" value={String(graded.length)} tone="teal" />
        <Stat label="Aprobados" value={graded.length ? `${passed}/${graded.length}` : "—"} tone="sage" />
        <Stat label="Pendientes de nota" value={String(pending.length)} tone={pending.length ? "gold" : undefined} />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-5 w-5" />}
          title="Sin exámenes"
          desc="Añade exámenes desde el calendario para poder registrar sus notas."
        />
      ) : (
        <ul className="divide-y divide-white/[0.04]">
          {rows.map((e) => {
            const s = subjects.find((x) => x.id === e.subjectId);
            const isFuture = e.date >= TODAY;
            const hasGrade = typeof e.grade === "number";
            const editing = editingId === e.id;
            return (
              <motion.li
                key={e.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors duration-200 hover:bg-white/[0.03]"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${s?.color ?? "#8b7fa5"}1a`, color: s?.color }}
                >
                  <GraduationCap className="h-4 w-4" />
                </span>

                <span className="min-w-[180px] flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[13.5px] font-medium text-mist-100">{e.title}</span>
                    {!hasGrade && !isFuture && (
                      <span className="shrink-0 rounded-full bg-gold-400/12 px-2 py-0.5 text-[10px] font-medium text-gold-300">
                        falta nota
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-mist-500">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: s?.color }} />
                    {s?.name} · {shortDate(e.date)}
                    {isFuture && <span className="text-mist-600">· {countdown(e.date)}</span>}
                  </span>
                </span>

                {/* barra de nota */}
                <span className="hidden w-[150px] shrink-0 md:block">
                  {hasGrade ? (
                    <span className="relative block h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                      <span
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ width: `${((e.grade ?? 0) / 10) * 100}%`, background: gradeColor(e.grade ?? 0) }}
                      />
                      <span className="absolute inset-y-[-3px] left-1/2 w-[1.5px] bg-mist-400/50" aria-hidden />
                    </span>
                  ) : (
                    <span className="block h-1.5 w-full rounded-full bg-white/[0.04]" />
                  )}
                </span>

                {/* nota / acción */}
                {editing ? (
                  <span className="flex shrink-0 items-center gap-1.5">
                    <input
                      autoFocus
                      value={draft}
                      onChange={(ev) => setDraft(ev.target.value)}
                      onKeyDown={(ev) => ev.key === "Enter" && saveGrade(e.id)}
                      inputMode="decimal"
                      placeholder="0-10"
                      className={cn(inputCls, "num h-9 w-[86px] px-2 py-0 text-[14px] no-spin")}
                    />
                    <IconBtn label="Guardar nota" className="h-9 w-9" onClick={() => saveGrade(e.id)}>
                      <Check className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn label="Cancelar" className="h-9 w-9" onClick={() => setEditingId(null)}>
                      <X className="h-3.5 w-3.5" />
                    </IconBtn>
                  </span>
                ) : hasGrade ? (
                  <span className="flex shrink-0 items-center gap-2">
                    <span
                      className="num w-[58px] rounded-xl border py-1.5 text-center text-[16px] font-bold"
                      style={{
                        color: gradeColor(e.grade ?? 0),
                        borderColor: `${gradeColor(e.grade ?? 0)}40`,
                        background: `${gradeColor(e.grade ?? 0)}12`,
                      }}
                    >
                      {(e.grade ?? 0).toLocaleString("es-ES")}
                    </span>
                    <IconBtn
                      label="Editar nota"
                      className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => {
                        setEditingId(e.id);
                        setDraft(String(e.grade));
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </IconBtn>
                  </span>
                ) : isFuture ? (
                  <span className="shrink-0 rounded-full border border-white/[0.08] px-2.5 py-1 text-[11px] text-mist-500">
                    {relativeDay(e.date)}
                  </span>
                ) : (
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => {
                      setEditingId(e.id);
                      setDraft("");
                    }}
                  >
                    Poner nota
                  </Button>
                )}
              </motion.li>
            );
          })}
        </ul>
      )}

      <p className="border-t border-white/[0.06] px-5 py-3 text-[11.5px] text-mist-600">
        Escala 0–10 · la marca central de la barra es el aprobado.
      </p>
    </Panel>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "teal" | "sage" | "gold" }) {
  return (
    <div className="px-5 py-3.5">
      <p className="text-[10.5px] tracking-[0.1em] text-mist-500 uppercase">{label}</p>
      <p
        className={cn(
          "num mt-1 text-[20px] font-semibold",
          tone === "teal" ? "text-teal-400" : tone === "sage" ? "text-sage-400" : tone === "gold" ? "text-gold-400" : "text-mist-50",
        )}
      >
        {value}
      </p>
    </div>
  );
}
