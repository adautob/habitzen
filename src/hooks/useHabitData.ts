
"use client";
import { useState, useEffect, useCallback } from "react";
import type { Habit, HabitLog, HabitFormData, Medal } from "@/types";
import {
  addHabit as dbAddHabit,
  getHabits as dbGetHabits,
  updateHabit as dbUpdateHabit,
  deleteHabit as dbDeleteHabit,
  logHabitCompletion as dbLogHabitCompletion,
  getHabitLogs as dbGetHabitLogs,
  getHabitLogByHabitIdAndDate as dbGetHabitLogByHabitIdAndDate,
  updateHabitLog as dbUpdateHabitLog,
  deleteHabitLog as dbDeleteHabitLog,
} from "@/lib/db";
import { POINTS_PER_DIFFICULTY } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { generateUUID } from "@/lib/uuid";
import { getAchievedMedals } from "@/lib/gamification";

export function useHabitData() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [achievedMedals, setAchievedMedals] = useState<Medal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogsLoading, setIsLogsLoading] = useState(true);
  const [isMedalsLoading, setIsMedalsLoading] = useState(true);

  const { toast } = useToast();

  const refreshHabits = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedHabits = await dbGetHabits();
      setHabits(fetchedHabits.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error("Failed to fetch habits:", error);
      toast({ title: "Erro", description: "Não foi possível carregar os hábitos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const refreshHabitLogs = useCallback(async () => {
    try {
      setIsLogsLoading(true);
      const fetchedLogs = await dbGetHabitLogs();
      setHabitLogs(fetchedLogs);
    } catch (error) {
      console.error("Failed to fetch habit logs:", error);
      toast({ title: "Erro", description: "Não foi possível carregar os registros de hábitos.", variant: "destructive" });
    } finally {
      setIsLogsLoading(false);
    }
  }, [toast]);

  const refreshMedals = useCallback(() => {
    if (!isLoading && !isLogsLoading) { // Ensure habits and logs are loaded
      setIsMedalsLoading(true);
      const currentAchievedMedals = getAchievedMedals(habits, habitLogs);
      setAchievedMedals(currentAchievedMedals);
      setIsMedalsLoading(false);
    }
  }, [habits, habitLogs, isLoading, isLogsLoading]);


  useEffect(() => {
    refreshHabits();
    refreshHabitLogs();
  }, [refreshHabits, refreshHabitLogs]);

  useEffect(() => {
    refreshMedals();
  }, [habits, habitLogs, refreshMedals]);


  const createHabit = async (formData: HabitFormData) => {
    const newHabit: Habit = {
      id: generateUUID(),
      ...formData,
      createdAt: Date.now(),
      points: POINTS_PER_DIFFICULTY[formData.difficulty],
    };
    try {
      await dbAddHabit(newHabit);
      toast({ title: "Sucesso", description: "Hábito criado com sucesso." });
      await refreshHabits(); 
    } catch (error) {
      console.error("Failed to create habit:", error);
      toast({ title: "Erro", description: "Não foi possível criar o hábito.", variant: "destructive" });
    }
  };

  const editHabit = async (habitId: string, formData: HabitFormData) => {
    const existingHabit = habits.find(h => h.id === habitId);
    if (!existingHabit) {
      toast({ title: "Erro", description: "Hábito não encontrado.", variant: "destructive" });
      return;
    }
    const updatedHabit: Habit = {
      ...existingHabit,
      ...formData,
      points: POINTS_PER_DIFFICULTY[formData.difficulty],
    };
    try {
      await dbUpdateHabit(updatedHabit);
      toast({ title: "Sucesso", description: "Hábito atualizado com sucesso." });
      await refreshHabits(); 
    } catch (error) {
      console.error("Failed to update habit:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar o hábito.", variant: "destructive" });
    }
  };

  const removeHabit = async (id: string) => {
    try {
      await dbDeleteHabit(id);
      toast({ title: "Sucesso", description: "Hábito excluído com sucesso." });
      await refreshHabits(); 
      await refreshHabitLogs(); 
    } catch (error) {
      console.error("Failed to delete habit:", error);
      toast({ title: "Erro", description: "Não foi possível excluir o hábito.", variant: "destructive" });
    }
  };

  const completeHabit = async (habitId: string, date: Date = new Date(), notes?: string) => {
    const dateString = format(date, "yyyy-MM-dd");
    try {
      const existingLog = await dbGetHabitLogByHabitIdAndDate(habitId, dateString);
      if (existingLog) {
        await dbDeleteHabitLog(existingLog.id);
        toast({ title: "Hábito Desmarcado", description: "Hábito marcado como não concluído para hoje." });
      } else {
        await dbLogHabitCompletion(habitId, dateString, notes);
        toast({ title: "Ótimo trabalho!", description: `Hábito concluído${notes ? ' com nota' : ''}.`, className: "bg-success text-success-foreground" });
      }
      await refreshHabitLogs(); 
    } catch (error) {
      console.error("Failed to log habit completion:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar a conclusão do hábito.", variant: "destructive" });
    }
  };

  const isHabitCompletedToday = useCallback((habitId: string, date: Date = new Date()): HabitLog | undefined => {
    const dateString = format(date, "yyyy-MM-dd");
    return habitLogs.find(log => log.habitId === habitId && log.date === dateString);
  }, [habitLogs]);
  
  const getCompletionsForHabitOnDate = useCallback((habitId: string, targetDate: Date): HabitLog[] => {
    const dateString = format(targetDate, "yyyy-MM-dd");
    return habitLogs.filter(log => log.habitId === habitId && log.date === dateString);
  }, [habitLogs]);

  const updateLogNotes = async (logId: string, newNotes: string | undefined) => {
    try {
      const logToUpdate = habitLogs.find(log => log.id === logId);
      if (!logToUpdate) {
        toast({ title: "Erro", description: "Registro de hábito não encontrado.", variant: "destructive" });
        return;
      }
      const updatedLog = { ...logToUpdate, notes: newNotes };
      await dbUpdateHabitLog(updatedLog);
      toast({ title: "Sucesso", description: "Nota atualizada com sucesso." });
      await refreshHabitLogs();
    } catch (error) {
      console.error("Failed to update log notes:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar a nota.", variant: "destructive" });
    }
  };


  return {
    habits,
    habitLogs,
    achievedMedals,
    isLoading: isLoading || isLogsLoading || isMedalsLoading,
    createHabit,
    editHabit,
    removeHabit,
    completeHabit,
    isHabitCompletedToday,
    getCompletionsForHabitOnDate,
    updateLogNotes,
    refreshHabits, 
    refreshHabitLogs,
  };
}
