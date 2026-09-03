import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../utils/cn";

/* --------------------------------- Panel ---------------------------------- */

export function Panel({
  className,
  children,
  glow,
}: {
  className?: string;
  children: ReactNode;
  glow?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[22px] border border-white/[0.07] bg-ink-850/80 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)] backdrop-blur-[2px]",
        className,
      )}
    >
      {glow && (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full opacity-[0.16] blur-3xl"
          style={{ background: glow }}
        />
      )}
      {children}
    </section>
  );
}

export function PanelHead({
  title,
  hint,
  action,
  className,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4", className)}>
      <div>
        <h2 className="font-display text-[17px] leading-tight font-semibold tracking-tight text-mist-50">{title}</h2>
        {hint && <p className="mt-0.5 text-[12.5px] text-mist-400">{hint}</p>}
      </div>
      {action}
    </header>
  );
}

/* -------------------------------- Button ---------------------------------- */

type Variant = "primary" | "ghost" | "outline" | "danger" | "soft";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gold-400 text-ink-950 hover:bg-gold-300 shadow-[0_10px_30px_-12px_rgba(242,169,59,0.85)] hover:shadow-[0_14px_34px_-10px_rgba(242,169,59,0.7)]",
  soft: "bg-white/[0.06] text-mist-100 hover:bg-white/[0.11] border border-white/[0.08]",
  outline: "border border-white/[0.14] text-mist-200 hover:border-gold-400/50 hover:text-mist-50",
  ghost: "text-mist-300 hover:bg-white/[0.06] hover:text-mist-50",
  danger: "bg-coral-400/12 text-coral-400 border border-coral-400/25 hover:bg-coral-400/20",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[12.5px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-[13.5px] gap-2 rounded-xl",
  lg: "h-12 px-5 text-[15px] gap-2 rounded-xl",
};

export function Button({
  variant = "soft",
  size = "md",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center font-medium transition-all duration-200 select-none",
        "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function IconBtn({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-mist-300",
        "transition-all duration-200 hover:border-gold-400/40 hover:bg-white/[0.08] hover:text-mist-50 active:scale-95",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* --------------------------------- Chips ---------------------------------- */

export function Chip({
  active,
  children,
  color,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; color?: string }) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-all duration-200 active:scale-95",
        active
          ? "border-transparent text-ink-950 shadow-[0_6px_18px_-10px_rgba(255,255,255,0.6)]"
          : "border-white/[0.1] bg-white/[0.03] text-mist-300 hover:border-white/25 hover:text-mist-100",
      )}
      style={active ? { background: color ?? "#f7f4fc", color: "#0b0910" } : undefined}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ------------------------------- Segmented -------------------------------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string; color?: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-0.5 rounded-xl border border-white/[0.08] bg-ink-900/70 p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "relative cursor-pointer rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors duration-200",
            value === o.value ? "text-ink-950" : "text-mist-400 hover:text-mist-100",
          )}
          style={value === o.value ? { background: o.color ?? "#f7f4fc" } : undefined}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------- Progress -------------------------------- */

export function Bar({
  value,
  color = "#f2a93b",
  track = "rgba(255,255,255,0.07)",
  height = 8,
  className,
}: {
  value: number;
  color?: string;
  track?: string;
  height?: number;
  className?: string;
}) {
  const v = Math.max(0, Math.min(1.35, value));
  return (
    <div className={cn("relative w-full overflow-hidden rounded-full", className)} style={{ height, background: track }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color, boxShadow: `0 0 14px ${color}66` }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, v * 100)}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
      {v > 1 && <span aria-hidden className="absolute top-0 right-0 h-full w-[3px] bg-coral-400" />}
    </div>
  );
}

export function Ring({
  value,
  size = 92,
  stroke = 9,
  color = "#f2a93b",
  children,
  track = "rgba(255,255,255,0.07)",
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
  track?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">{children}</span>
    </div>
  );
}

/* -------------------------------- CountUp --------------------------------- */

export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(origin + (target - origin) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

export function CountUp({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const animated = useCountUp(value);
  return <span className={className}>{format(animated)}</span>;
}

/* --------------------------------- Fields --------------------------------- */

export const inputCls =
  "w-full rounded-xl border border-white/[0.09] bg-ink-900/70 px-3 py-2.5 text-[14px] text-mist-50 placeholder:text-mist-500 outline-none transition-all duration-200 focus:border-gold-400/60 focus:bg-ink-900 focus:ring-4 focus:ring-gold-400/10";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-baseline justify-between text-[11.5px] font-semibold tracking-[0.08em] text-mist-400 uppercase">
        {label}
        {hint && <span className="font-normal tracking-normal normal-case text-mist-500">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-[12px] text-coral-400">{error}</span>}
    </label>
  );
}

/* --------------------------------- Modal ---------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.985 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className={cn(
              "relative w-full overflow-hidden rounded-t-[26px] border border-white/[0.09] bg-ink-850 shadow-[0_40px_120px_-30px_rgba(0,0,0,1)] sm:rounded-[26px]",
              width,
            )}
          >
            <header className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-5">
              <div>
                <h3 className="font-display text-xl font-semibold tracking-tight text-mist-50">{title}</h3>
                {subtitle && <p className="mt-1 text-[13px] text-mist-400">{subtitle}</p>}
              </div>
              <IconBtn label="Cerrar" onClick={onClose}>
                <X className="h-4 w-4" />
              </IconBtn>
            </header>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5 scroll-thin">{children}</div>
            {footer && (
              <footer className="flex items-center justify-end gap-2 border-t border-white/[0.06] bg-ink-900/60 px-6 py-4">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* --------------------------------- Toasts --------------------------------- */

type Tone = "ok" | "warn" | "info";
interface Toast {
  id: number;
  title: string;
  desc?: string;
  tone: Tone;
}

const ToastCtx = createContext<(t: Omit<Toast, "id">) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

const TONES: Record<Tone, string> = {
  ok: "border-teal-400/40 bg-teal-400/10 text-teal-300",
  warn: "border-coral-400/40 bg-coral-400/10 text-coral-400",
  info: "border-peri-400/40 bg-peri-400/10 text-peri-400",
};

export function ToastHost({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev.slice(-3), { ...t, id }]);
    window.setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 3600);
  }, []);
  const value = useMemo(() => push, [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-2xl border bg-ink-800/95 px-4 py-3 backdrop-blur-md",
                TONES[t.tone],
              )}
            >
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-current" />
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-mist-50">{t.title}</p>
                {t.desc && <p className="mt-0.5 text-[12.5px] text-mist-400">{t.desc}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

/* ------------------------------- Empty state ------------------------------ */

export function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-mist-400">
        {icon}
      </span>
      <p className="font-display text-[15px] font-semibold text-mist-100">{title}</p>
      <p className="max-w-xs text-[13px] text-mist-500">{desc}</p>
      {action}
    </div>
  );
}
