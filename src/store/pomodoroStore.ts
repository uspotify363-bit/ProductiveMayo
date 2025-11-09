import { create } from "zustand";
import { persist } from "zustand/middleware";

const WORK_DURATION = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;

export interface FocusStrategy {
  name: string;
  workDuration: number;
  breakDuration: number;
  description: string;
  technique: string;
}

interface PomodoroState {
  task: string;
  setTask: (task: string) => void;
  timeLeft: number;
  setTimeLeft: (timeLeft: number) => void;
  isRunning: boolean;
  setIsRunning: (isRunning: boolean) => void;
  isBreak: boolean;
  setIsBreak: (isBreak: boolean) => void;
  cycleCount: number;
  setCycleCount: (cycleCount: number) => void;
  status: string;
  setStatus: (status: string) => void;
  currentSessionId: string | null;
  setCurrentSessionId: (id: string | null) => void;
  dailyGoal: string;
  setDailyGoal: (goal: string) => void;
  focusStrategy: FocusStrategy | null;
  setFocusStrategy: (strategy: FocusStrategy | null) => void;
}

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set) => ({
      task: "",
      setTask: (task: string) => set({ task }),

      timeLeft: WORK_DURATION,
      setTimeLeft: (timeLeft: number) => set({ timeLeft }),

      isRunning: false,
      setIsRunning: (isRunning: boolean) => set({ isRunning }),

      isBreak: false,
      setIsBreak: (isBreak: boolean) => set({ isBreak }),

      cycleCount: 0,
      setCycleCount: (cycleCount: number) => set({ cycleCount }),

      status: "Work",
      setStatus: (status: string) => set({ status }),

      currentSessionId: null,
      setCurrentSessionId: (id: string | null) => set({ currentSessionId: id }),

      dailyGoal: "",
      setDailyGoal: (goal: string) => set({ dailyGoal: goal }),

      focusStrategy: null,
      setFocusStrategy: (strategy: FocusStrategy | null) => set({ focusStrategy: strategy }),
    }),
    { name: "pomodoro-storage" }
  )
);

export { WORK_DURATION, SHORT_BREAK, LONG_BREAK };
