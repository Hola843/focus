import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { TODAY } from "./core";

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

const KEY = "estela.todos.v2";
const uid = () => Math.random().toString(36).slice(2, 10);

const SEED: Todo[] = [];

interface TodoValue {
  todos: Todo[];
  add: (text: string) => void;
  toggle: (id: string) => void;
  update: (id: string, text: string) => void;
  remove: (id: string) => void;
  reorder: (from: number, to: number) => void;
  clearDone: () => void;
  clearAll: () => void;
  doneCount: number;
}

const Ctx = createContext<TodoValue | null>(null);

function load(): Todo[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Todo[];
    }
  } catch {
    /* ignore */
  }
  return SEED;
}

export function TodoProvider({ children }: { children: ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(todos));
    } catch {
      /* ignore */
    }
  }, [todos]);

  const value = useMemo<TodoValue>(
    () => ({
      todos,
      add: (text) => {
        const clean = text.trim();
        if (!clean) return;
        setTodos((prev) => [{ id: uid(), text: clean, done: false, createdAt: TODAY }, ...prev]);
      },
      toggle: (id) => setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))),
      update: (id, text) =>
        setTodos((prev) =>
          text.trim() ? prev.map((t) => (t.id === id ? { ...t, text: text.trim() } : t)) : prev.filter((t) => t.id !== id),
        ),
      remove: (id) => setTodos((prev) => prev.filter((t) => t.id !== id)),
      reorder: (from, to) =>
        setTodos((prev) => {
          if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
          const next = [...prev];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          return next;
        }),
      clearDone: () => setTodos((prev) => prev.filter((t) => !t.done)),
      clearAll: () => setTodos([]),
      doneCount: todos.filter((t) => t.done).length,
    }),
    [todos],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTodos() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTodos fuera de TodoProvider");
  return ctx;
}


