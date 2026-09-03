import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  TODAY,
  addDays,
  currentStreak,
  minutesByDay,
  minutesOn,
  startOfWeek,
  uid,
  weekRange,
  minutesBetween,
  type Entry,
  type Exam,
  type Gratitude,
  type Habit,
  type Plan,
  type Session,
  type Settings,
  type Subject,
  type Task,
  type TaskStatus,
} from "./core";
import {
  seedEntries,
  seedExams,
  seedGratitudes,
  seedHabits,
  seedLogs,
  seedPlans,
  seedSessions,
  seedSettings,
  seedSubjects,
  seedTasks,
} from "./seed";

export interface State {
  habits: Habit[];
  logs: Record<string, string[]>;
  subjects: Subject[];
  sessions: Session[];
  tasks: Task[];
  entries: Entry[];
  plans: Plan[];
  exams: Exam[];
  gratitudes: Gratitude[];
  settings: Settings;
}

type Action =
  | { type: "habit/add"; habit: Habit }
  | { type: "habit/update"; habit: Habit }
  | { type: "habit/delete"; id: string }
  | { type: "habit/toggle"; id: string; date: string }
  | { type: "subject/add"; subject: Subject }
  | { type: "subject/update"; subject: Subject }
  | { type: "subject/delete"; id: string }
  | { type: "session/add"; session: Session }
  | { type: "session/delete"; id: string }
  | { type: "task/add"; task: Task }
  | { type: "task/update"; task: Task }
  | { type: "task/delete"; id: string }
  | { type: "task/move"; id: string; status: TaskStatus }
  | { type: "entry/add"; entry: Entry }
  | { type: "entry/update"; entry: Entry }
  | { type: "entry/delete"; id: string }
  | { type: "plan/add"; plan: Plan }
  | { type: "plan/update"; plan: Plan }
  | { type: "plan/delete"; id: string }
  | { type: "plan/done"; id: string; done: boolean }
  | { type: "exam/add"; exam: Exam }
  | { type: "exam/update"; exam: Exam }
  | { type: "exam/delete"; id: string }
  | { type: "gratitude/add"; date: string; items: string[] }
  | { type: "settings/set"; patch: Partial<Settings> }
  | { type: "reset"; mode: "blank" | "demo" };

const KEY = "estela.state.v2";
/** Claves de versiones anteriores: se descartan para arrancar limpio. */
const LEGACY_KEYS = ["estela.state.v1", "estela.todos.v1", "estela.pillars.v1"];

function fresh(): State {
  const habits = seedHabits();
  const subjects = seedSubjects();
  return {
    habits,
    logs: seedLogs(habits),
    subjects,
    sessions: seedSessions(subjects),
    tasks: seedTasks(subjects),
    entries: seedEntries(),
    plans: seedPlans(subjects),
    exams: seedExams(subjects),
    gratitudes: seedGratitudes(),
    settings: seedSettings(),
  };
}

/** Estado virgen: sin hábitos, materias, sesiones, tareas, exámenes ni notas. */
function blank(): State {
  return {
    habits: [],
    logs: {},
    subjects: [],
    sessions: [],
    tasks: [],
    entries: [],
    plans: [],
    exams: [],
    gratitudes: [],
    settings: seedSettings(),
  };
}

function load(): State {
  try {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<State>;
      if (Array.isArray(p.habits) && p.habits.length) {
        const base = fresh();
        return {
          habits: p.habits,
          logs: p.logs ?? {},
          subjects: p.subjects ?? base.subjects,
          sessions: p.sessions ?? base.sessions,
          tasks: p.tasks ?? base.tasks,
          entries: p.entries ?? base.entries,
          plans: p.plans ?? base.plans,
          exams: p.exams ?? base.exams,
          gratitudes: p.gratitudes ?? base.gratitudes,
          settings: { ...base.settings, ...(p.settings ?? {}) },
        };
      }
    }
  } catch {
    /* ignore */
  }
  return blank();
}

const toggleIn = (list: string[] | undefined, date: string) => {
  const arr = list ?? [];
  return arr.includes(date) ? arr.filter((d) => d !== date) : [...arr, date].sort();
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "habit/add":
      return { ...state, habits: [...state.habits, action.habit], logs: { ...state.logs, [action.habit.id]: [] } };
    case "habit/update":
      return { ...state, habits: state.habits.map((h) => (h.id === action.habit.id ? action.habit : h)) };
    case "habit/delete": {
      const logs = { ...state.logs };
      delete logs[action.id];
      return { ...state, habits: state.habits.filter((h) => h.id !== action.id), logs };
    }
    case "habit/toggle":
      return { ...state, logs: { ...state.logs, [action.id]: toggleIn(state.logs[action.id], action.date) } };
    case "subject/add":
      return { ...state, subjects: [...state.subjects, action.subject] };
    case "subject/update":
      return { ...state, subjects: state.subjects.map((s) => (s.id === action.subject.id ? action.subject : s)) };
    case "subject/delete":
      return {
        ...state,
        subjects: state.subjects.filter((s) => s.id !== action.id),
        sessions: state.sessions.filter((s) => s.subjectId !== action.id),
      };
    case "session/add":
      return { ...state, sessions: [...state.sessions, action.session] };
    case "session/delete":
      return { ...state, sessions: state.sessions.filter((s) => s.id !== action.id) };
    case "task/add":
      return { ...state, tasks: [action.task, ...state.tasks] };
    case "task/update":
      return { ...state, tasks: state.tasks.map((t) => (t.id === action.task.id ? action.task : t)) };
    case "task/delete":
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };
    case "task/move":
      return { ...state, tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, status: action.status } : t)) };
    case "entry/add":
      return { ...state, entries: [...state.entries, action.entry].sort((a, b) => (a.date < b.date ? 1 : -1)) };
    case "entry/update":
      return { ...state, entries: state.entries.map((e) => (e.id === action.entry.id ? action.entry : e)) };
    case "entry/delete":
      return { ...state, entries: state.entries.filter((e) => e.id !== action.id) };
    case "plan/add":
      return { ...state, plans: [...state.plans, action.plan].sort((a, b) => (a.date + a.start < b.date + b.start ? -1 : 1)) };
    case "plan/update":
      return { ...state, plans: state.plans.map((p) => (p.id === action.plan.id ? action.plan : p)) };
    case "plan/delete": {
      const plan = state.plans.find((p) => p.id === action.id);
      return {
        ...state,
        plans: state.plans.filter((p) => p.id !== action.id),
        sessions: plan?.sessionId ? state.sessions.filter((s) => s.id !== plan.sessionId) : state.sessions,
      };
    }
    case "plan/done": {
      const plan = state.plans.find((p) => p.id === action.id);
      if (!plan) return state;
      if (action.done) {
        const sessionId = uid();
        return {
          ...state,
          plans: state.plans.map((p) => (p.id === action.id ? { ...p, done: true, sessionId } : p)),
          sessions: [
            ...state.sessions,
            {
              id: sessionId,
              date: plan.date,
              subjectId: plan.subjectId,
              minutes: plan.minutes,
              type: "libre",
              note: `Agenda · ${plan.title}`,
            },
          ],
        };
      }
      return {
        ...state,
        plans: state.plans.map((p) => (p.id === action.id ? { ...p, done: false, sessionId: undefined } : p)),
        sessions: plan.sessionId ? state.sessions.filter((s) => s.id !== plan.sessionId) : state.sessions,
      };
    }
    case "exam/add":
      return { ...state, exams: [...state.exams, action.exam].sort((a, b) => (a.date < b.date ? -1 : 1)) };
    case "exam/update":
      return { ...state, exams: state.exams.map((e) => (e.id === action.exam.id ? action.exam : e)) };
    case "exam/delete":
      return { ...state, exams: state.exams.filter((e) => e.id !== action.id) };
    case "gratitude/add": {
      const existing = state.gratitudes.find((g) => g.date === action.date);
      const next: Gratitude = existing
        ? { ...existing, items: action.items }
        : { id: uid(), date: action.date, items: action.items };
      return {
        ...state,
        gratitudes: existing
          ? state.gratitudes.map((g) => (g.date === action.date ? next : g))
          : [next, ...state.gratitudes].sort((a, b) => (a.date > b.date ? -1 : 1)),
      };
    }
    case "settings/set":
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case "reset":
      return action.mode === "demo" ? fresh() : blank();
    default:
      return state;
  }
}

interface Store extends State {
  todayMinutes: number;
  todaySessions: Session[];
  weekMinutes: number;
  last7: { date: string; minutes: number }[];
  streaks: Record<string, number>;
  bestStreaks: Record<string, number>;
  todayDone: number;
  pomodorosToday: number;
  weekStart: string;
  addHabit: (h: Omit<Habit, "id">) => void;
  updateHabit: (h: Habit) => void;
  deleteHabit: (id: string) => void;
  toggleHabit: (id: string, date: string) => void;
  addSubject: (s: Omit<Subject, "id">) => void;
  updateSubject: (s: Subject) => void;
  deleteSubject: (id: string) => void;
  addSession: (s: Omit<Session, "id">) => void;
  deleteSession: (id: string) => void;
  addTask: (t: Omit<Task, "id">) => void;
  updateTask: (t: Task) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, status: TaskStatus) => void;
  addEntry: (e: Omit<Entry, "id">) => void;
  updateEntry: (e: Entry) => void;
  deleteEntry: (id: string) => void;
  addPlan: (p: Omit<Plan, "id">) => void;
  updatePlan: (p: Plan) => void;
  deletePlan: (id: string) => void;
  setPlanDone: (id: string, done: boolean) => void;
  addExam: (e: Omit<Exam, "id">) => void;
  updateExam: (e: Exam) => void;
  deleteExam: (id: string) => void;
  nextExam: Exam | null;
  upcomingExams: Exam[];
  upcomingPlans: Plan[];
  addGratitude: (date: string, items: string[]) => void;
  todayGratitude: Gratitude | null;
  gratitudeStreak: number;
  setSettings: (patch: Partial<Settings>) => void;
  reset: (mode?: "blank" | "demo") => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const weekStart = useMemo(() => startOfWeek(TODAY), []);
  const { end: weekEnd } = useMemo(() => weekRange(TODAY), []);

  const value = useMemo<Store>(() => {
    const logsOf = (id: string) => state.logs[id] ?? [];
    return {
      ...state,
      todayMinutes: minutesOn(state.sessions, TODAY),
      todaySessions: state.sessions.filter((s) => s.date === TODAY),
      weekMinutes: minutesBetween(state.sessions, weekStart, weekEnd),
      last7: minutesByDay(state.sessions, 7),
      pomodorosToday: state.sessions.filter((s) => s.date === TODAY && s.type === "pomodoro").length,
      streaks: Object.fromEntries(state.habits.map((h) => [h.id, currentStreak(logsOf(h.id))])),
      bestStreaks: Object.fromEntries(
        state.habits.map((h) => [h.id, (() => {
          const sorted = [...new Set(logsOf(h.id))].sort();
          let best = 0;
          let run = 0;
          let prev = "";
          for (const d of sorted) {
            run = prev && Date.parse(d) - Date.parse(prev) === 86400000 ? run + 1 : 1;
            best = Math.max(best, run);
            prev = d;
          }
          return best;
        })()]),
      ),
      todayDone: state.habits.filter((h) => logsOf(h.id).includes(TODAY)).length,
      weekStart,
      addHabit: (h) => dispatch({ type: "habit/add", habit: { ...h, id: uid() } }),
      updateHabit: (habit) => dispatch({ type: "habit/update", habit }),
      deleteHabit: (id) => dispatch({ type: "habit/delete", id }),
      toggleHabit: (id, date) => dispatch({ type: "habit/toggle", id, date }),
      addSubject: (s) => dispatch({ type: "subject/add", subject: { ...s, id: uid() } }),
      updateSubject: (subject) => dispatch({ type: "subject/update", subject }),
      deleteSubject: (id) => dispatch({ type: "subject/delete", id }),
      addSession: (s) => dispatch({ type: "session/add", session: { ...s, id: uid() } }),
      deleteSession: (id) => dispatch({ type: "session/delete", id }),
      addTask: (t) => dispatch({ type: "task/add", task: { ...t, id: uid() } }),
      updateTask: (task) => dispatch({ type: "task/update", task }),
      deleteTask: (id) => dispatch({ type: "task/delete", id }),
      moveTask: (id, status) => dispatch({ type: "task/move", id, status }),
      addEntry: (e) => dispatch({ type: "entry/add", entry: { ...e, id: uid() } }),
      updateEntry: (entry) => dispatch({ type: "entry/update", entry }),
      deleteEntry: (id) => dispatch({ type: "entry/delete", id }),
      addPlan: (p) => dispatch({ type: "plan/add", plan: { ...p, id: uid() } }),
      updatePlan: (plan) => dispatch({ type: "plan/update", plan }),
      deletePlan: (id) => dispatch({ type: "plan/delete", id }),
      setPlanDone: (id, done) => dispatch({ type: "plan/done", id, done }),
      addExam: (e) => dispatch({ type: "exam/add", exam: { ...e, id: uid() } }),
      updateExam: (exam) => dispatch({ type: "exam/update", exam }),
      deleteExam: (id) => dispatch({ type: "exam/delete", id }),
      upcomingExams: state.exams.filter((e) => e.date >= TODAY),
      nextExam: state.exams.filter((e) => e.date >= TODAY)[0] ?? null,
      upcomingPlans: state.plans.filter((p) => p.date >= TODAY && !p.done),
      addGratitude: (date, items) => dispatch({ type: "gratitude/add", date, items }),
      todayGratitude: state.gratitudes.find((g) => g.date === TODAY) ?? null,
      gratitudeStreak: (() => {
        const set = new Set(state.gratitudes.map((g) => g.date));
        let cursor = TODAY;
        if (!set.has(cursor)) return 0;
        let count = 0;
        while (set.has(cursor)) {
          count++;
          cursor = addDays(cursor, -1);
        }
        return count;
      })(),
      setSettings: (patch) => dispatch({ type: "settings/set", patch }),
      reset: (mode = "blank") => dispatch({ type: "reset", mode }),
    };
  }, [state, weekStart, weekEnd]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore debe usarse dentro de StoreProvider");
  return ctx;
}


