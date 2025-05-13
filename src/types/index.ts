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

export interface Medal {
  id: string;
  name: string;
  description: string;
  iconName: string; // Lucide icon name
  achievedAt: number | null; // Timestamp, or null if not achieved
  criteria: (habits: Habit[], logs: HabitLog[]) => boolean; // Function to check if medal is achieved
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
  // medalsAchieved: Medal[]; // Or just store achieved medal IDs
}
