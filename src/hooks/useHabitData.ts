
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
import { POINTS_PER_DIFFICULTY, HABIT_COLORS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { generateUUID } from "@/lib/uuid";
import { getAchievedMedals } from "@/lib/gamification";

export function useHabitData() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [achievedMedals, setAchievedMedals] = useState<Medal[]>([]);
  
  const [isLoadingHabits, setIsLoadingHabits] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isLoadingMedals, setIsLoadingMedals] = useState(true);

  const { toast } = useToast();

  const refreshHabits = useCallback(async () => {
    try {
      setIsLoadingHabits(true);
      const fetchedHabits = await dbGetHabits();
      setHabits((fetchedHabits || []).sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error("Failed to fetch habits:", error);
      toast({ title: "Erro", description: "Não foi possível carregar os hábitos.", variant: "destructive" });
      setHabits([]);
    } finally {
      setIsLoadingHabits(false);
    }
  }, [toast]);

  const refreshHabitLogs = useCallback(async () => {
    try {
      setIsLoadingLogs(true);
      const fetchedLogs = await dbGetHabitLogs();
      setHabitLogs(fetchedLogs || []);
    } catch (error) {
      console.error("Failed to fetch habit logs:", error);
      toast({ title: "Erro", description: "Não foi possível carregar os registros de hábitos.", variant: "destructive" });
      setHabitLogs([]);
    } finally {
      setIsLoadingLogs(false);
    }
  }, [toast]);

  useEffect(() => {
    refreshHabits();
    refreshHabitLogs();
  }, [refreshHabits, refreshHabitLogs]);

  useEffect(() => {
    if (!isLoadingHabits && !isLoadingLogs) {
      // Somente calcula medalhas se hábitos e logs estiverem carregados
      setIsLoadingMedals(true); // Indica que estamos processando medalhas
      const currentAchievedMedals = getAchievedMedals(habits, habitLogs);
      setAchievedMedals(currentAchievedMedals || []);
      setIsLoadingMedals(false); // Medalhas processadas
    } else {
      // Se hábitos ou logs ainda estão carregando, medalhas também estão efetivamente "carregando" ou pendentes.
      // Mantém ou redefine isLoadingMedals para true para que o isLoading geral reflita isso.
      if (!isLoadingMedals) { // Apenas para garantir, se por algum motivo ficou false
        setIsLoadingMedals(true);
      }
    }
  }, [isLoadingHabits, isLoadingLogs, habits, habitLogs]); // Reavalia quando os estados de carregamento base ou os dados mudam


  const createHabit = async (formData: HabitFormData) => {
    const newHabit: Habit = {
      id: generateUUID(),
      name: formData.name,
      category: formData.category,
      difficulty: formData.difficulty,
      frequency: formData.frequency,
      color: formData.color === HABIT_COLORS[0].value ? undefined : formData.color,
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
      name: formData.name,
      category: formData.category,
      difficulty: formData.difficulty,
      frequency: formData.frequency,
      color: formData.color === HABIT_COLORS[0].value ? undefined : formData.color,
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
    isLoading: isLoadingHabits || isLoadingLogs || isLoadingMedals,
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
