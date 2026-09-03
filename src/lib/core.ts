import {
  BarChart3,
  BookOpen,
  Brain,
  Brush,
  Calculator,
  Code2,
  Dumbbell,
  FlaskConical,
  Flower2,
  Globe2,
  Guitar,
  HeartPulse,
  Languages,
  Moon,
  NotebookPen,
  Palette,
  PenLine,
  PhoneOff,
  Piano,
  Sigma,
  Sparkles,
  Target,
  Utensils,
  type LucideIcon,
} from "lucide-react";

/* ---------------------------------- types --------------------------------- */

export type TaskStatus = "pendiente" | "curso" | "hecha";
export type Priority = "alta" | "media" | "baja";

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  weekly: number; // días objetivo por semana
  note: string;
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetHours: number;
}

export interface Session {
  id: string;
  date: string; // yyyy-mm-dd
  subjectId: string;
  minutes: number;
  type: "pomodoro" | "libre";
  note: string;
}

export interface Task {
  id: string;
  title: string;
  subjectId: string;
  status: TaskStatus;
  priority: Priority;
  due: string;
  createdAt: string;
}

export interface Entry {
  id: string;
  date: string;
  text: string;
  tags: string[];
}

export interface Settings {
  focus: number;
  short: number;
  long: number;
  dailyMinutes: number;
  pomodorosLong: number;
}

/** Sesión de estudio planificada en la agenda. */
export interface Plan {
  id: string;
  date: string;
  start: string; // HH:MM
  subjectId: string;
  title: string;
  minutes: number;
  done: boolean;
  /** Sesión generada al completar la planificación. */
  sessionId?: string;
}

/** Tres agradecimientos del ritual de entrada. */
export interface Gratitude {
  id: string;
  date: string;
  items: string[];
}

/** Examen o entrega con fecha fijada. */
export interface Exam {
  id: string;
  date: string;
  time: string;
  subjectId: string;
  title: string;
  place: string;
  /** Nota obtenida (0-10). Null o undefined si aún no se conoce. */
  grade?: number | null;
}

/* --------------------------------- icons ---------------------------------- */

export const HABIT_ICONS: Record<string, LucideIcon> = {
  BookOpen,
  Dumbbell,
  Flower2,
  Moon,
  NotebookPen,
  PhoneOff,
  Brain,
  HeartPulse,
  PenLine,
  Utensils,
  Sparkles,
  Target,
  Guitar,
  Piano,
};

export const SUBJECT_ICONS: Record<string, LucideIcon> = {
  Sigma,
  Calculator,
  Languages,
  Code2,
  Palette,
  Brush,
  BarChart3,
  FlaskConical,
  Globe2,
  BookOpen,
  Brain,
  NotebookPen,
};

export const habitIcon = (key: string): LucideIcon => HABIT_ICONS[key] ?? Sparkles;
export const subjectIcon = (key: string): LucideIcon => SUBJECT_ICONS[key] ?? BookOpen;

export const JOURNAL_TAGS = ["estudio", "descanso", "familia", "trabajo", "lectura", "ejercicio", "ideas"];

export const PALETTE = ["#f2a93b", "#37c7b0", "#7c93ff", "#f06ba8", "#ff7a6b", "#9fd356"];

/* ---------------------------------- dates --------------------------------- */

export const pad = (n: number) => String(n).padStart(2, "0");

export function iso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const TODAY = iso(new Date());

export function addDays(key: string, delta: number) {
  const d = fromISO(key);
  d.setDate(d.getDate() + delta);
  return iso(d);
}

export function daysBack(count: number, end = TODAY) {
  return Array.from({ length: count }, (_, i) => addDays(end, -(count - 1 - i)));
}

export function startOfWeek(key: string) {
  const d = fromISO(key);
  const dow = (d.getDay() + 6) % 7; // lunes = 0
  d.setDate(d.getDate() - dow);
  return iso(d);
}

export function weekRange(key: string) {
  const start = startOfWeek(key);
  return { start, end: addDays(start, 6) };
}

export const weekday = (key: string) => {
  const s = fromISO(key).toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const weekdayLetter = (key: string) => weekday(key).slice(0, 1);

export function longDate(key: string) {
  const s = fromISO(key).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function shortDate(key: string) {
  return fromISO(key).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }).replace(".", "");
}

export function relativeDay(key: string) {
  if (key === TODAY) return "Hoy";
  if (key === addDays(TODAY, -1)) return "Ayer";
  return `${weekday(key)} ${shortDate(key)}`;
}

export function monthLabel(key: string) {
  const s = fromISO(key).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function weekLabel(key: string) {
  const { start, end } = weekRange(key);
  const a = fromISO(start).toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", "");
  const b = fromISO(end).toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", "");
  return `${a} – ${b}`;
}

export function weekNumber(key: string) {
  const d = fromISO(key);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day + 3);
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  const fDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - fDay + 3);
  return 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86400000));
}

export const isFuture = (key: string) => key > TODAY;

/* --------------------------------- format --------------------------------- */

export function fmtMinutes(min: number) {
  const m = Math.round(min);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} h ${rest} min` : `${h} h`;
}

export const fmtHours = (min: number) =>
  `${(Math.round((min / 60) * 10) / 10).toLocaleString("es-ES", { minimumFractionDigits: 1 })} h`;

export const pct = (n: number) => `${Math.round(n * 100)} %`;
export const uid = () => Math.random().toString(36).slice(2, 10);

export function greeting() {
  const h = new Date().getHours();
  if (h < 6) return "Buenas noches";
  if (h < 13) return "Buenos días";
  if (h < 21) return "Buenas tardes";
  return "Buenas noches";
}

/* ------------------------------- aggregations ----------------------------- */

export function currentStreak(dates: string[]) {
  const set = new Set(dates);
  let cursor = TODAY;
  if (!set.has(cursor)) {
    cursor = addDays(TODAY, -1);
    if (!set.has(cursor)) return 0;
  }
  let count = 0;
  while (set.has(cursor)) {
    count++;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function bestStreak(dates: string[]) {
  const sorted = [...new Set(dates)].sort();
  let best = 0;
  let run = 0;
  let prev = "";
  for (const d of sorted) {
    run = prev && fromISO(d).getTime() - fromISO(prev).getTime() === 86400000 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export function completionRate(dates: string[], days: number, end = TODAY) {
  const window = new Set(daysBack(days, end));
  const done = dates.filter((d) => window.has(d)).length;
  return days ? done / days : 0;
}

export const minutesOn = (sessions: Session[], date: string) =>
  sessions.filter((s) => s.date === date).reduce((sum, s) => sum + s.minutes, 0);

export function minutesBetween(sessions: Session[], from: string, to: string) {
  return sessions.filter((s) => s.date >= from && s.date <= to).reduce((sum, s) => sum + s.minutes, 0);
}

export function minutesByDay(sessions: Session[], days: number, end = TODAY) {
  return daysBack(days, end).map((d) => ({ date: d, minutes: minutesOn(sessions, d) }));
}

export function minutesBySubject(sessions: Session[], from: string, to = TODAY) {
  const map = new Map<string, number>();
  for (const s of sessions) {
    if (s.date < from || s.date > to) continue;
    map.set(s.subjectId, (map.get(s.subjectId) ?? 0) + s.minutes);
  }
  return map;
}

export function weeklyMinutes(sessions: Session[], weeks: number) {
  return Array.from({ length: weeks }, (_, i) => {
    const anchor = addDays(startOfWeek(TODAY), -(weeks - 1 - i) * 7);
    const { start, end } = weekRange(anchor);
    return { start, minutes: minutesBetween(sessions, start, end) };
  });
}

export function weeklyCompletion(logs: string[], weeks: number) {
  return Array.from({ length: weeks }, (_, i) => {
    const end = addDays(startOfWeek(TODAY), -(weeks - 1 - i) * 7 + 6);
    return { end, rate: completionRate(logs, 7, end) };
  });
}

/* -------------------------------- calendario ------------------------------ */

export const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export const monthKeyOf = (date: string) => date.slice(0, 7);

export function addMonthKey(key: string, delta: number) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function monthTitle(key: string) {
  const [y, m] = key.split("-").map(Number);
  const s = new Date(y, m - 1, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Rejilla de 6 semanas (42 celdas) que empieza en lunes. */
export function monthGrid(key: string): { date: string; inMonth: boolean }[] {
  const [y, m] = key.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(y, m - 1, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const date = iso(d);
    return { date, inMonth: monthKeyOf(date) === key };
  });
}

export const daysUntil = (date: string) =>
  Math.round((fromISO(date).getTime() - fromISO(TODAY).getTime()) / 86400000);

export function countdown(date: string) {
  const d = daysUntil(date);
  if (d === 0) return "hoy";
  if (d === 1) return "mañana";
  if (d < 0) return `hace ${Math.abs(d)} d`;
  return `en ${d} días`;
}

export const sortPlans = (a: { start: string }, b: { start: string }) => (a.start < b.start ? -1 : 1);
