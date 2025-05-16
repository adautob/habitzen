
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

export const HABIT_COLORS: { name: string; value: string; tailwindClass: string }[] = [
  { name: "Padrão", value: "", tailwindClass: "bg-transparent" }, // Ou uma cor padrão sutil
  { name: "Vermelho", value: "hsl(0 72% 51%)", tailwindClass: "bg-red-500" }, // red-500
  { name: "Laranja", value: "hsl(25 95% 53%)", tailwindClass: "bg-orange-500" }, // orange-500
  { name: "Amarelo", value: "hsl(48 96% 53%)", tailwindClass: "bg-yellow-500" }, // yellow-500
  { name: "Verde", value: "hsl(142 71% 45%)", tailwindClass: "bg-green-500" }, // green-500
  { name: "Azul", value: "hsl(221 83% 53%)", tailwindClass: "bg-blue-500" }, // blue-500
  { name: "Roxo", value: "hsl(262 83% 58%)", tailwindClass: "bg-purple-500" }, // purple-500
  { name: "Rosa", value: "hsl(323 81% 57%)", tailwindClass: "bg-pink-500" }, // pink-500
];

