
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
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getAchievedMedals } from "@/lib/gamification";
import { useUser } from "@/firebase/auth/use-user";

export function useHabitData() {
  const { user, isLoading: isUserLoading } = useUser();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [achievedMedals, setAchievedMedals] = useState<Medal[]>([]);
  
  const [isLoadingHabits, setIsLoadingHabits] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isLoadingMedals, setIsLoadingMedals] = useState(true);

  const { toast } = useToast();

  const refreshData = useCallback(async () => {
    if (!user) {
      setHabits([]);
      setHabitLogs([]);
      setIsLoadingHabits(false);
      setIsLoadingLogs(false);
      return;
    };
    
    setIsLoadingHabits(true);
    setIsLoadingLogs(true);
    try {
      const [fetchedHabits, fetchedLogs] = await Promise.all([
        dbGetHabits(),
        dbGetHabitLogs(),
      ]);
      setHabits((fetchedHabits || []).sort((a, b) => b.createdAt - a.createdAt));
      setHabitLogs(fetchedLogs || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({ title: "Erro", description: "Não foi possível carregar os dados.", variant: "destructive" });
      setHabits([]);
      setHabitLogs([]);
    } finally {
      setIsLoadingHabits(false);
      setIsLoadingLogs(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!isUserLoading) {
        refreshData();
    }
  }, [isUserLoading, refreshData]);

  useEffect(() => {
    if (!isLoadingHabits && !isLoadingLogs) {
      setIsLoadingMedals(true);
      const currentAchievedMedals = getAchievedMedals(habits, habitLogs);
      setAchievedMedals(currentAchievedMedals || []);
      setIsLoadingMedals(false);
    } else {
      if (!isLoadingMedals) {
        setIsLoadingMedals(true);
      }
    }
  }, [isLoadingHabits, isLoadingLogs, habits, habitLogs]);


  const createHabit = async (formData: HabitFormData) => {
    try {
      await dbAddHabit(formData);
      toast({ title: "Sucesso", description: "Hábito criado com sucesso." });
      await refreshData(); 
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

    // A função updateHabit agora espera o objeto Habit completo
    const updatedHabitData: Habit = {
        ...existingHabit,
        ...formData,
    };
    
    try {
      await dbUpdateHabit(updatedHabitData);
      toast({ title: "Sucesso", description: "Hábito atualizado com sucesso." });
      await refreshData(); 
    } catch (error) {
      console.error("Failed to update habit:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar o hábito.", variant: "destructive" });
    }
  };

  const removeHabit = async (id: string) => {
    try {
      await dbDeleteHabit(id);
      toast({ title: "Sucesso", description: "Hábito excluído com sucesso." });
      await refreshData(); 
    } catch (error) {
      console.error("Failed to delete habit:", error);
      toast({ title: "Erro", description: "Não foi possível excluir o hábito.", variant: "destructive" });
    }
  };

  const completeHabit = async (habitId: string, date: Date = new Date(), notes?: string) => {
    const dateString = format(date, "yyyy-MM-dd");
    try {
      const existingLog = await dbGetHabitLogByHabitIdAndDate(habitId, dateString);
      if (existingLog && existingLog.id) {
        await dbDeleteHabitLog(existingLog.id);
        toast({ title: "Hábito Desmarcado", description: "Hábito marcado como não concluído para hoje." });
      } else {
        await dbLogHabitCompletion(habitId, dateString, notes);
        toast({ title: "Ótimo trabalho!", description: `Hábito concluído${notes ? ' com nota' : ''}.`, className: "bg-success text-success-foreground" });
      }
      await refreshData(); 
    } catch (error) {
      console.error("Failed to log habit completion:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar a conclusão do hábito.", variant: "destructive" });
    }
  };

  const isHabitCompletedToday = useCallback((habitId: string, date: Date = new Date()): HabitLog | undefined => {
    const dateString = format(date, "yyyy-MM-dd");
    if (!Array.isArray(habitLogs)) return undefined;
    return habitLogs.find(log => log.habitId === habitId && log.date === dateString);
  }, [habitLogs]);
  
  const getCompletionsForHabitOnDate = useCallback((habitId: string, targetDate: Date): HabitLog[] => {
    const dateString = format(targetDate, "yyyy-MM-dd");
    if (!Array.isArray(habitLogs)) return [];
    return habitLogs.filter(log => log.habitId === habitId && log.date === dateString);
  }, [habitLogs]);

  const updateLogNotes = async (logId: string, newNotes: string | undefined) => {
    try {
      if (!Array.isArray(habitLogs)) {
         toast({ title: "Erro", description: "Registros de hábitos não carregados.", variant: "destructive" });
         return;
      }
      const logToUpdate = habitLogs.find(log => log.id === logId);
      if (!logToUpdate) {
        toast({ title: "Erro", description: "Registro de hábito não encontrado.", variant: "destructive" });
        return;
      }
      // Se newNotes for undefined, removemos o campo. Se for uma string vazia, mantemos.
      const updatedLogData: any = { ...logToUpdate, notes: newNotes };
       if (newNotes === undefined) {
           delete updatedLogData.notes;
       }

      await dbUpdateHabitLog(updatedLogData);
      toast({ title: "Sucesso", description: "Nota atualizada com sucesso." });
      await refreshData();
    } catch (error) {
      console.error("Failed to update log notes:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar a nota.", variant: "destructive" });
    }
  };


  return {
    habits,
    habitLogs,
    achievedMedals,
    isLoading: isUserLoading || isLoadingHabits || isLoadingLogs || isLoadingMedals,
    createHabit,
    editHabit,
    removeHabit,
    completeHabit,
    isHabitCompletedToday,
    getCompletionsForHabitOnDate,
    updateLogNotes,
  };
}
