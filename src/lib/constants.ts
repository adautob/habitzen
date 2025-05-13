import type { HabitDifficulty, HabitFrequency } from "@/types";

export const HABIT_CATEGORIES: string[] = [
  "Fitness",
  "Saúde",
  "Trabalho",
  "Aprendizado",
  "Finanças",
  "Hobbies",
  "Crescimento Pessoal",
  "Casa",
  "Social",
  "Outro",
];

export const HABIT_DIFFICULTIES: { label: string; value: HabitDifficulty }[] = [
  { label: "Fácil (1 Estrela)", value: 1 },
  { label: "Médio (2 Estrelas)", value: 2 },
  { label: "Difícil (3 Estrelas)", value: 3 },
];

export const HABIT_FREQUENCIES: { label: string; value: HabitFrequency }[] = [
  { label: "Diário", value: "daily" },
  { label: "Semanal", value: "weekly" },
];

export const DB_NAME = "HabitZenDB";
export const DB_VERSION = 1;
export const HABITS_STORE_NAME = "habits";
export const HABIT_LOGS_STORE_NAME = "habitLogs";

export const POINTS_PER_DIFFICULTY: Record<HabitDifficulty, number> = {
  1: 10,
  2: 20,
  3: 30,
};
