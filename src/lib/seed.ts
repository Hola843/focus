import {
  TODAY,
  addDays,
  daysBack,
  fromISO,
  startOfWeek,
  type Entry,
  type Exam,
  type Gratitude,
  type Habit,
  type Plan,
  type Session,
  type Settings,
  type Subject,
  type Task,
} from "./core";

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(40731);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const chance = (p: number) => rnd() < p;

/* --------------------------------- hábitos -------------------------------- */

export function seedHabits(): Habit[] {
  return [
    { id: "h1", name: "Leer 20 minutos", icon: "BookOpen", color: "#f2a93b", weekly: 7, note: "Novela o ensayo, sin pantallas." },
    { id: "h2", name: "Mover el cuerpo", icon: "Dumbbell", color: "#ff7a6b", weekly: 5, note: "Gimnasio, bici o paseo largo." },
    { id: "h3", name: "Meditar 10 min", icon: "Flower2", color: "#7c93ff", weekly: 6, note: "Respiración guiada al despertar." },
    { id: "h4", name: "Repasar apuntes", icon: "NotebookPen", color: "#37c7b0", weekly: 6, note: "Recuerdo activo + tarjetas." },
    { id: "h5", name: "Sin redes 2 h", icon: "PhoneOff", color: "#f06ba8", weekly: 5, note: "Móvil en otra habitación." },
    { id: "h6", name: "Dormir 8 horas", icon: "Moon", color: "#9fd356", weekly: 7, note: "Apagar luces antes de las 23:30." },
  ];
}

const PROB: Record<string, number> = { h1: 0.78, h2: 0.6, h3: 0.66, h4: 0.72, h5: 0.5, h6: 0.7 };

export function seedLogs(habits: Habit[]) {
  const days = daysBack(70);
  const logs: Record<string, string[]> = {};
  for (const h of habits) {
    const list: string[] = [];
    days.forEach((d, i) => {
      const dow = (fromISO(d).getDay() + 6) % 7;
      const weekendPenalty = dow >= 5 ? -0.12 : 0;
      const momentum = i / days.length / 3; // mejora con el tiempo
      const streakBoost = h.id === "h4" && i > days.length - 6 ? 0.3 : 0;
      if (chance(Math.min(0.95, PROB[h.id] + weekendPenalty + momentum + streakBoost))) list.push(d);
    });
    logs[h.id] = list;
  }
  return logs;
}

/* -------------------------------- materias -------------------------------- */

export function seedSubjects(): Subject[] {
  return [
    { id: "s1", name: "Cálculo II", icon: "Sigma", color: "#7c93ff", targetHours: 40 },
    { id: "s2", name: "Inglés C1", icon: "Languages", color: "#37c7b0", targetHours: 30 },
    { id: "s3", name: "Programación", icon: "Code2", color: "#f2a93b", targetHours: 35 },
    { id: "s4", name: "Historia del Arte", icon: "Palette", color: "#f06ba8", targetHours: 20 },
    { id: "s5", name: "Estadística", icon: "BarChart3", color: "#ff7a6b", targetHours: 25 },
  ];
}

const NOTES = [
  "Ejercicios del tema 4",
  "Resumen del capítulo",
  "Repaso con tarjetas",
  "Práctica de examen",
  "Vocabulario nuevo",
  "Kata de algoritmos",
  "Lectura y esquemas",
  "Corrección de errores",
];

export function seedSessions(subjects: Subject[]) {
  const out: Session[] = [];
  const days = daysBack(56);
  days.forEach((d) => {
    const dow = (fromISO(d).getDay() + 6) % 7;
    if (dow === 6 && !chance(0.45)) return;
    const blocks = 1 + Math.floor(rnd() * (dow >= 5 ? 2 : 3.2));
    for (let i = 0; i < blocks; i++) {
      const subject = subjects[Math.floor(rnd() * subjects.length)];
      const pomodoro = chance(0.55);
      out.push({
        id: `sess-${d}-${i}`,
        date: d,
        subjectId: subject.id,
        minutes: pomodoro ? (chance(0.6) ? 25 : 50) : 60 + Math.floor(rnd() * 4) * 15,
        type: pomodoro ? "pomodoro" : "libre",
        note: pick(NOTES),
      });
    }
  });
  // hoy aún puede estar empezando
  return out.filter((s) => s.date <= TODAY);
}

/* --------------------------------- tareas --------------------------------- */

export function seedTasks(subjects: Subject[]): Task[] {
  const base = startOfWeek(TODAY);
  const raw: [string, string, Task["status"], Task["priority"], number][] = [
    ["Entregar problema 7 de Cálculo", "s1", "pendiente", "alta", 2],
    ["Escribir redacción IELTS", "s2", "curso", "alta", 3],
    ["Refactorizar el proyecto de React", "s3", "curso", "media", 5],
    ["Fichas del Renacimiento italiano", "s4", "pendiente", "media", 4],
    ["Ejercicios de regresión lineal", "s5", "pendiente", "baja", 7],
    ["Repasar verbos irregulares", "s2", "hecha", "media", -2],
    ["Leer capítulo 6 del manual", "s3", "hecha", "baja", -4],
    ["Simulacro de examen", "s1", "pendiente", "alta", 9],
    ["Corregir apuntes escaneados", "s4", "hecha", "baja", -6],
  ];
  return raw.map(([title, subjectId, status, priority, offset], i) => ({
    id: `t${i + 1}`,
    title,
    subjectId,
    status,
    priority,
    due: addDays(base, offset),
    createdAt: addDays(TODAY, -10 + i),
  })).filter((t) => subjects.some((s) => s.id === t.subjectId));
}

/* --------------------------------- diario --------------------------------- */

const TEXTS: [string, string[]][] = [
  ["Día productivo: dos bloques de Cálculo y una hora de lectura. Me noto más constante que la semana pasada.", ["estudio", "lectura"]],
  ["Cuesta arrancar por la mañana. Probé a estudiar de pie y funcionó mejor de lo esperado.", ["estudio", "ideas"]],
  ["Terminé el simulacro entero y después salí a correr. Quiero repetir este orden.", ["ejercicio", "estudio"]],
  ["Noche corta y cabeza espesa. Solo un bloque útil. Mañana empiezo por lo difícil.", ["descanso"]],
  ["La técnica del recuerdo activo va dando frutos: repasé el tema 4 sin mirar los apuntes.", ["estudio", "ideas"]],
  ["Trabajé dos horas seguidas y por la tarde vi a la familia. Buen equilibrio.", ["familia", "descanso"]],
  ["Todo se juntó: entrega, cansancio y mala cabeza. Escribo para soltar y pasar página.", ["trabajo"]],
  ["Cuatro pomodoros de programación y el proyecto por fin compila. Pequeña victoria.", ["estudio", "ideas"]],
  ["Leí 30 minutos antes de dormir en vez de mirar el móvil. Se nota al despertar.", ["lectura", "descanso"]],
  ["Semana cerrada con 12 horas de estudio real. La constancia pesa más que la motivación.", ["estudio"]],
];

export function seedEntries(): Entry[] {
  const slots = [58, 53, 47, 41, 36, 30, 25, 19, 12, 5];
  return slots.map((back, i) => {
    const [text, tags] = TEXTS[i % TEXTS.length];
    return { id: `e${i + 1}`, date: addDays(TODAY, -back), text, tags };
  });
}

export function seedSettings(): Settings {
  return { focus: 25, short: 5, long: 15, dailyMinutes: 120, pomodorosLong: 4 };
}

/* ------------------------------- gratitud --------------------------------- */

const GRATITUDE_POOL = [
  "El café tranquilo de las siete, sin mirar el móvil",
  "Que Marta me llamara justo cuando lo necesitaba",
  "Terminar el ejercicio 12 después de tres intentos",
  "La luz de última hora entrando por la ventana",
  "Poder caminar al campus con buen tiempo",
  "Una ducha larga después de un día espeso",
  "Que el código compilara a la primera",
  "La playlist nueva para estudiar",
  "Dormir ocho horas seguidas",
  "La paciencia del profesor en la tutoría",
  "Un mensaje inesperado de mi hermano",
  "El bocadillo de la biblioteca con Andrea",
  "Sentir que por fin entiendo el tema 4",
  "La siesta de veinte minutos que me reinició",
  "Que alguien me cediera el sitio en el bus",
  "Tener agua caliente sin pensarlo",
  "Reírme tanto que me dolió la barriga",
  "El olor a lluvia al salir de clase",
  "Que mi abuela me contara otra vez la misma historia",
  "Cerrar el portátil sabiendo que di lo suficiente",
  "Un rato de piano sin mirar la partitura",
  "La calma de la casa a las seis de la mañana",
  "Que el cuerpo aguantara el entrenamiento",
  "Encontrar el libro que buscaba en la estantería",
];

export function seedGratitudes(): Gratitude[] {
  const out: Gratitude[] = [];
  const pool = [...GRATITUDE_POOL];
  for (let back = 1; back <= 11; back++) {
    const items: string[] = [];
    while (items.length < 3) {
      const idx = Math.floor(rnd() * pool.length);
      items.push(pool.splice(idx, 1)[0]);
    }
    out.push({ id: `gr-${back}`, date: addDays(TODAY, -back), items });
  }
  return out;
}

/* --------------------------------- agenda --------------------------------- */

const PLAN_TITLES: Record<string, string[]> = {
  s1: ["Ejercicios del tema 4", "Repaso de integrales", "Problemas de series", "Corrección de errores"],
  s2: ["Vocabulario + listening", "Redacción tipo IELTS", "Speaking con pareja", "Repaso de phrasal verbs"],
  s3: ["Kata de algoritmos", "Refactor del proyecto", "Repaso de hooks de React", "Tests del módulo"],
  s4: ["Fichas del Renacimiento", "Esquemas del Barroco", "Lectura del manual"],
  s5: ["Ejercicios de regresión", "Probabilidad condicionada", "Resumen del tema 3"],
};

const SLOTS = ["08:30", "10:00", "12:30", "16:00", "18:30", "20:00"];
const BLOCKS = [25, 25, 50, 60, 75, 90];

export function seedPlans(subjects: Subject[]): Plan[] {
  const out: Plan[] = [];
  const span = daysBack(12);
  const upcoming = Array.from({ length: 17 }, (_, i) => addDays(TODAY, i + 1));

  [...span, ...upcoming].forEach((date) => {
    const dow = (fromISO(date).getDay() + 6) % 7;
    if (dow === 6 && !chance(0.4)) return;
    const count = dow >= 5 ? 1 : 1 + Math.floor(rnd() * 2);
    const usedSlots: string[] = [];
    for (let i = 0; i < count; i++) {
      const subject = subjects[Math.floor(rnd() * subjects.length)];
      let slot = pick(SLOTS);
      while (usedSlots.includes(slot)) slot = pick(SLOTS);
      usedSlots.push(slot);
      out.push({
        id: `plan-${date}-${i}`,
        date,
        start: slot,
        subjectId: subject.id,
        title: (PLAN_TITLES[subject.id] ?? ["Sesión de estudio"])[
          Math.floor(rnd() * (PLAN_TITLES[subject.id]?.length ?? 1))
        ],
        minutes: pick(BLOCKS),
        done: date <= TODAY,
      });
    }
  });
  return out;
}

export function seedExams(subjects: Subject[]): Exam[] {
  // [materia, días respecto a hoy, hora, título, lugar, nota]
  const raw: [string, number, string, string, string, number | null][] = [
    ["s5", -52, "09:00", "Parcial de septiembre · Estadística", "Aula 1.8 · Edificio Norte", 6.4],
    ["s4", -38, "12:00", "Comentario de obra · Historia del Arte", "Aula 2.5", 8.1],
    ["s2", -24, "17:30", "Prueba de nivel · Inglés", "Academia · Sala B", 7.5],
    ["s3", -16, "15:00", "Práctica evaluable de React", "Campus virtual", 9],
    ["s1", -9, "11:00", "Parcial de Cálculo II", "Aula 3.2 · Facultad de Ciencias", null],
    ["s2", 6, "17:30", "Mock exam Cambridge C1", "Academia · Sala B", null],
    ["s5", 13, "09:00", "Parcial de Estadística", "Aula 1.8 · Edificio Norte", null],
    ["s3", 21, "15:00", "Entrega del proyecto de React", "Campus virtual", null],
    ["s1", 34, "09:30", "Examen final de Cálculo II", "Aula Magna", null],
    ["s4", 45, "12:00", "Examen de Historia del Arte", "Aula 2.5", null],
  ];
  return raw
    .filter(([sid]) => subjects.some((s) => s.id === sid))
    .map(([sid, offset, time, title, place, grade]) => ({
      id: `ex-${sid}-${offset}`,
      date: addDays(TODAY, offset),
      time,
      subjectId: sid,
      title,
      place,
      grade,
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}
