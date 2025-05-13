import type { HabitDifficulty, HabitFrequency } from "@/types";

export const HABIT_CATEGORIES: string[] = [
  "Fitness",
  "Health",
  "Work",
  "Learning",
  "Finance",
  "Hobbies",
  "Personal Growth",
  "Home",
  "Social",
  "Other",
];

export const HABIT_DIFFICULTIES: { label: string; value: HabitDifficulty }[] = [
  { label: "Easy (1 Star)", value: 1 },
  { label: "Medium (2 Stars)", value: 2 },
  { label: "Hard (3 Stars)", value: 3 },
];

export const HABIT_FREQUENCIES: { label: string; value: HabitFrequency }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
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
