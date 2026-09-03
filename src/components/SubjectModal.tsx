import { BookOpen, Check, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { PALETTE, SUBJECT_ICONS, subjectIcon } from "../lib/core";
import { useStore } from "../lib/store";
import { useUI } from "../lib/ui-state";
import { cn } from "../utils/cn";
import { Button, Field, IconBtn, Modal, inputCls, useToast } from "./ui";

const ICON_KEYS = Object.keys(SUBJECT_ICONS);

export function SubjectModal() {
  const { subjectModal, closeSubjects } = useUI();
  const { subjects, addSubject, deleteSubject } = useStore();
  const toast = useToast();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICON_KEYS[0]);
  const [color, setColor] = useState(PALETTE[0]);

  const save = () => {
    if (!name.trim()) return toast({ title: "Ponle nombre a la materia", tone: "warn" });
    if (subjects.some((s) => s.name.toLowerCase() === name.trim().toLowerCase()))
      return toast({ title: "Ya existe una materia con ese nombre", tone: "warn" });
    addSubject({ name: name.trim(), icon, color, targetHours: 20 });
    toast({ title: "Materia creada", desc: name.trim(), tone: "ok" });
    setName("");
  };

  return (
    <Modal
      open={subjectModal}
      onClose={closeSubjects}
      title="Tus materias"
      subtitle="Dan color al calendario, al temporizador y a las notas"
      footer={
        <Button variant="primary" onClick={closeSubjects}>
          <Check className="h-4 w-4" />
          Listo
        </Button>
      }
    >
      <div className="space-y-5">
        {subjects.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/[0.1] px-4 py-8 text-center">
            <BookOpen className="h-5 w-5 text-mist-600" />
            <p className="text-[13.5px] font-medium text-mist-200">Todavía no tienes materias</p>
            <p className="max-w-xs text-[12.5px] leading-relaxed text-mist-500">
              Crea la primera para poder planificar sesiones, apuntar exámenes y registrar sus notas.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {subjects.map((s) => {
              const Icon = subjectIcon(s.icon);
              return (
                <li
                  key={s.id}
                  className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-ink-900/50 p-3 transition-colors hover:border-white/[0.16]"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${s.color}1f`, color: s.color }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium text-mist-100">{s.name}</span>
                    <span className="num block text-[11px] text-mist-500">objetivo {s.targetHours} h/mes</span>
                  </span>
                  <IconBtn
                    label={`Eliminar ${s.name}`}
                    className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 hover:border-coral-400/50 hover:bg-coral-400/10 hover:text-coral-400"
                    onClick={() => {
                      deleteSubject(s.id);
                      toast({ title: "Materia eliminada", desc: `${s.name} y sus sesiones`, tone: "warn" });
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconBtn>
                </li>
              );
            })}
          </ul>
        )}

        <div className="border-t border-white/[0.06] pt-4">
          <p className="mb-3 text-[10.5px] font-semibold tracking-[0.14em] text-mist-500 uppercase">Añadir materia</p>
          <div className="space-y-3">
            <Field label="Nombre">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                placeholder="Cálculo II, Inglés, Cocina…"
                className={inputCls}
              />
            </Field>
            <div>
              <span className="mb-2 block text-[11.5px] font-semibold tracking-[0.08em] text-mist-400 uppercase">Icono</span>
              <div className="flex flex-wrap gap-1.5">
                {ICON_KEYS.map((k) => {
                  const I = SUBJECT_ICONS[k];
                  return (
                    <button
                      key={k}
                      onClick={() => setIcon(k)}
                      className={cn(
                        "cursor-pointer rounded-lg border p-2 transition-all duration-200 active:scale-95",
                        icon === k ? "border-transparent text-ink-950" : "border-white/[0.09] bg-white/[0.03] text-mist-400 hover:text-mist-100",
                      )}
                      style={icon === k ? { background: color } : undefined}
                    >
                      <I className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <span className="mb-2 block text-[11.5px] font-semibold tracking-[0.08em] text-mist-400 uppercase">Color</span>
              <div className="flex flex-wrap gap-2">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    aria-label={`Color ${c}`}
                    className={cn(
                      "h-8 w-8 cursor-pointer rounded-full transition-transform duration-200 hover:scale-110",
                      color === c && "ring-2 ring-mist-50 ring-offset-2 ring-offset-ink-850",
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
            <Button variant="soft" className="w-full" onClick={save}>
              <Plus className="h-4 w-4" />
              Añadir materia
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
