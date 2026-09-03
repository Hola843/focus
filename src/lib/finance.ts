import {
  Baby,
  Bike,
  Briefcase,
  Bus,
  Car,
  Clapperboard,
  Coins,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  Music,
  PawPrint,
  Plane,
  ReceiptText,
  Repeat,
  ShoppingBag,
  Sparkles,
  Store,
  Tv,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/* ---------------------------------- types --------------------------------- */

export type TxType = "gasto" | "ingreso";

export interface Tx {
  id: string;
  date: string; // yyyy-mm-dd
  merchant: string;
  concept: string;
  category: string; // category id
  type: TxType;
  amount: number; // siempre positivo
  account: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  monthly: number;
  color: string;
  icon: string;
}

export interface Category {
  id: string;
  label: string;
  color: string;
  icon: LucideIcon;
  type: TxType;
}

/* -------------------------------- categories ------------------------------- */

export const CATEGORIES: Category[] = [
  { id: "alimentacion", label: "Alimentación", color: "#ff6f5a", icon: UtensilsCrossed, type: "gasto" },
  { id: "transporte", label: "Transporte", color: "#4c9ff0", icon: Bus, type: "gasto" },
  { id: "vivienda", label: "Vivienda", color: "#9b8cff", icon: Home, type: "gasto" },
  { id: "ocio", label: "Ocio", color: "#f2b441", icon: Gamepad2, type: "gasto" },
  { id: "salud", label: "Salud", color: "#ff5d8f", icon: HeartPulse, type: "gasto" },
  { id: "compras", label: "Compras", color: "#2dd4a7", icon: ShoppingBag, type: "gasto" },
  { id: "suscripciones", label: "Suscripciones", color: "#7dd3fc", icon: Repeat, type: "gasto" },
  { id: "educacion", label: "Formación", color: "#c0a3ff", icon: GraduationCap, type: "gasto" },
  { id: "nomina", label: "Nómina", color: "#2dd4a7", icon: Briefcase, type: "ingreso" },
  { id: "freelance", label: "Freelance", color: "#7ff0cd", icon: Laptop, type: "ingreso" },
  { id: "extras", label: "Extras", color: "#f2b441", icon: Sparkles, type: "ingreso" },
];

export const CAT_MAP: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
);

export const GOAL_ICONS: Record<string, LucideIcon> = {
  Plane,
  Wallet,
  Laptop,
  Home,
  Bike,
  Car,
  Music,
  Tv,
  Dumbbell,
  Baby,
  PawPrint,
  Store,
  Coins,
  Clapperboard,
  ReceiptText,
};

export function cat(id: string): Category {
  return CAT_MAP[id] ?? { id, label: id, color: "#7e91a1", icon: Wallet, type: "gasto" };
}

export const ACCOUNTS = ["Cuenta Nómina", "Tarjeta Coral", "Efectivo", "Cuenta Ahorro"];

/* --------------------------------- format ---------------------------------- */

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});
const eur0 = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const num = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });

export const money = (n: number) => eur.format(n);
export const money0 = (n: number) => eur0.format(Math.round(n));
export const compact = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1000) return `${num.format(Math.round(n / 100) / 10)}k €`;
  return `${num.format(Math.round(n))} €`;
};
export const pct = (n: number) => `${num.format(Math.round(n * 10) / 10)} %`;

export function signed(n: number, type: TxType) {
  return type === "gasto" ? `−${money(n)}` : `+${money(n)}`;
}

/* ---------------------------------- dates ---------------------------------- */

export const pad = (n: number) => String(n).padStart(2, "0");

export function toISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const monthKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export function addMonths(key: string, delta: number) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKey(d);
}

export function daysInMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export function monthLabel(key: string, style: "long" | "short" = "long") {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  const s = d.toLocaleDateString("es-ES", { month: style, year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function dayLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-ES", { month: "short" });
}

export function dayShort(iso: string) {
  return fromISO(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

export function weekdayShort(iso: string) {
  const s = fromISO(iso).toLocaleDateString("es-ES", { weekday: "short" });
  return s.charAt(0).toUpperCase() + s.slice(1).replace(".", "");
}

export const TODAY = toISO(new Date());
export const THIS_MONTH = monthKey(new Date());

/* ------------------------------- aggregations ------------------------------ */

export const inMonth = (txs: Tx[], key: string) => txs.filter((t) => t.date.startsWith(key));

export function totals(txs: Tx[]) {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.type === "ingreso") income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, net: income - expense };
}

export function byCategory(txs: Tx[], type: TxType = "gasto") {
  const map = new Map<string, number>();
  for (const t of txs) {
    if (t.type !== type) continue;
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }
  return [...map.entries()]
    .map(([id, total]) => ({ ...cat(id), total }))
    .sort((a, b) => b.total - a.total);
}

export function lastMonths(key: string, count: number) {
  return Array.from({ length: count }, (_, i) => addMonths(key, -(count - 1 - i)));
}

export function seriesByMonth(txs: Tx[], keys: string[]) {
  return keys.map((k) => ({ key: k, ...totals(inMonth(txs, k)) }));
}

export function dailySpending(txs: Tx[], key: string) {
  const dim = daysInMonth(key);
  const out = new Array(dim).fill(0);
  for (const t of txs) {
    if (!t.date.startsWith(key) || t.type !== "gasto") continue;
    out[Number(t.date.slice(8, 10)) - 1] += t.amount;
  }
  return out;
}

export const uid = () => Math.random().toString(36).slice(2, 10);
