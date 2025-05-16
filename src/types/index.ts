
import type { LucideIcon } from "lucide-react";

export type HabitDifficulty = 1 | 2 | 3;
export type HabitFrequency = "daily" | "weekly";

export interface Habit {
  id: string;
  name: string;
  category: string;
  difficulty: HabitDifficulty;
  frequency: HabitFrequency;
  createdAt: number; // Timestamp
  color?: string; // Optional color for UI representation
  points: number; // Points awarded for completing this habit
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD format
  completedAt: number; // Timestamp
}

// Base definition of a medal (static data)
export interface MedalDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon; 
  group: string; // e.g., "Consistency", "Creation", "Points"
}

// Medal instance, including achievement status
export interface Medal extends MedalDefinition {
  achievedAt: number | null; // Timestamp, or null if not achieved
}


export interface HabitFormData {
  name: string;
  category: string;
  difficulty: HabitDifficulty;
  frequency: HabitFrequency;
}

// For data export
export interface ExportData {
  habits: Habit[];
  habitLogs: HabitLog[];
  achievedMedals?: Pick<Medal, 'id' | 'achievedAt'>[]; 
}
