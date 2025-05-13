"use client";
import { useState, useEffect, useCallback } from "react";
import type { Habit, HabitLog, HabitFormData } from "@/types";
import {
  addHabit as dbAddHabit,
  getHabits as dbGetHabits,
  updateHabit as dbUpdateHabit,
  deleteHabit as dbDeleteHabit,
  logHabitCompletion as dbLogHabitCompletion,
  getHabitLogs as dbGetHabitLogs,
  getHabitLogByHabitIdAndDate as dbGetHabitLogByHabitIdAndDate,
  deleteHabitLog as dbDeleteHabitLog,
} from "@/lib/db";
import { POINTS_PER_DIFFICULTY } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function useHabitData() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const refreshHabits = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedHabits = await dbGetHabits();
      setHabits(fetchedHabits.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error("Failed to fetch habits:", error);
      toast({ title: "Error", description: "Could not load habits.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const refreshHabitLogs = useCallback(async () => {
    try {
      // setIsLoading(true); // Potentially separate loading state for logs
      const fetchedLogs = await dbGetHabitLogs();
      setHabitLogs(fetchedLogs);
    } catch (error) {
      console.error("Failed to fetch habit logs:", error);
      toast({ title: "Error", description: "Could not load habit logs.", variant: "destructive" });
    } finally {
      // setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    refreshHabits();
    refreshHabitLogs();
  }, [refreshHabits, refreshHabitLogs]);

  const createHabit = async (formData: HabitFormData) => {
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      ...formData,
      createdAt: Date.now(),
      points: POINTS_PER_DIFFICULTY[formData.difficulty],
    };
    try {
      await dbAddHabit(newHabit);
      toast({ title: "Success", description: "Habit created successfully." });
      await refreshHabits();
    } catch (error) {
      console.error("Failed to create habit:", error);
      toast({ title: "Error", description: "Could not create habit.", variant: "destructive" });
    }
  };

  const editHabit = async (habitId: string, formData: HabitFormData) => {
    const existingHabit = habits.find(h => h.id === habitId);
    if (!existingHabit) {
      toast({ title: "Error", description: "Habit not found.", variant: "destructive" });
      return;
    }
    const updatedHabit: Habit = {
      ...existingHabit,
      ...formData,
      points: POINTS_PER_DIFFICULTY[formData.difficulty],
    };
    try {
      await dbUpdateHabit(updatedHabit);
      toast({ title: "Success", description: "Habit updated successfully." });
      await refreshHabits();
    } catch (error) {
      console.error("Failed to update habit:", error);
      toast({ title: "Error", description: "Could not update habit.", variant: "destructive" });
    }
  };

  const removeHabit = async (id: string) => {
    try {
      await dbDeleteHabit(id);
      toast({ title: "Success", description: "Habit deleted successfully." });
      await refreshHabits();
      await refreshHabitLogs(); // Logs for this habit are also deleted
    } catch (error) {
      console.error("Failed to delete habit:", error);
      toast({ title: "Error", description: "Could not delete habit.", variant: "destructive" });
    }
  };

  const completeHabit = async (habitId: string, date: Date = new Date()) => {
    const dateString = format(date, "yyyy-MM-dd");
    try {
      // Check if already completed
      const existingLog = await dbGetHabitLogByHabitIdAndDate(habitId, dateString);
      if (existingLog) {
        // If user clicks again, uncomplete it
        await dbDeleteHabitLog(existingLog.id);
        toast({ title: "Habit Unmarked", description: "Habit marked as not complete for today." });
      } else {
        await dbLogHabitCompletion(habitId, dateString);
        toast({ title: "Great job!", description: "Habit marked as complete.", className: "bg-success text-success-foreground" });
      }
      await refreshHabitLogs();
    } catch (error) {
      console.error("Failed to log habit completion:", error);
      toast({ title: "Error", description: "Could not update habit completion.", variant: "destructive" });
    }
  };

  const isHabitCompletedToday = useCallback((habitId: string, date: Date = new Date()): boolean => {
    const dateString = format(date, "yyyy-MM-dd");
    return habitLogs.some(log => log.habitId === habitId && log.date === dateString);
  }, [habitLogs]);
  
  const getCompletionsForHabitOnDate = useCallback((habitId: string, targetDate: Date): HabitLog[] => {
    const dateString = format(targetDate, "yyyy-MM-dd");
    return habitLogs.filter(log => log.habitId === habitId && log.date === dateString);
  }, [habitLogs]);


  return {
    habits,
    habitLogs,
    isLoading,
    createHabit,
    editHabit,
    removeHabit,
    completeHabit,
    isHabitCompletedToday,
    getCompletionsForHabitOnDate,
    refreshHabits,
    refreshHabitLogs,
  };
}
