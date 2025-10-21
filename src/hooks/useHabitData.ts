
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
  updateHabitLog as dbUpdateHabitLog,
  deleteHabitLog as dbDeleteHabitLog,
} from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getAchievedMedals } from "@/lib/gamification";
import { useUser } from "@/firebase/auth/use-user";
import { generateUUID } from "@/lib/uuid";
import { POINTS_PER_DIFFICULTY } from "@/lib/constants";


export function useHabitData() {
  const { user, isLoading: isUserLoading } = useUser();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [achievedMedals, setAchievedMedals] = useState<Medal[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();

  // Função para buscar dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setHabits([]);
        setHabitLogs([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
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
        setIsLoading(false);
      }
    };

    if (!isUserLoading) {
      fetchData();
    }
  }, [isUserLoading, user, toast]);


  // Atualizar medalhas quando os dados mudam
  useEffect(() => {
    if (!isLoading) {
      const currentAchievedMedals = getAchievedMedals(habits, habitLogs);
      setAchievedMedals(currentAchievedMedals || []);
    }
  }, [habits, habitLogs, isLoading]);

  const createHabit = async (formData: HabitFormData) => {
    if (!user) return;
    
    // Otimista: Atualiza UI primeiro
    const newHabit: Habit = {
      id: generateUUID(), // ID temporário
      createdAt: Date.now(),
      points: POINTS_PER_DIFFICULTY[formData.difficulty],
      ...formData,
    };
    setHabits(prev => [newHabit, ...prev]);
    toast({ title: "Sucesso", description: "Hábito criado com sucesso." });
    
    try {
      // Sincroniza com DB
      const newId = await dbAddHabit(formData);
      // Atualiza o ID do hábito com o ID real do DB
      setHabits(prev => prev.map(h => h.id === newHabit.id ? { ...h, id: newId } : h));
    } catch (error) {
      console.error("Failed to create habit:", error);
      toast({ title: "Erro", description: "Falha ao salvar hábito. Desfazendo.", variant: "destructive" });
      // Rollback em caso de falha
      setHabits(prev => prev.filter(h => h.id !== newHabit.id));
    }
  };

  const editHabit = async (habitId: string, formData: HabitFormData) => {
    const originalHabits = habits;
    const habitToUpdate = habits.find(h => h.id === habitId);
    if (!habitToUpdate) return;
    
    const updatedHabit = { 
        ...habitToUpdate, 
        ...formData,
        points: POINTS_PER_DIFFICULTY[formData.difficulty] // Recalcula pontos se dificuldade mudar
    };

    // Otimista
    setHabits(prev => prev.map(h => h.id === habitId ? updatedHabit : h));
    toast({ title: "Sucesso", description: "Hábito atualizado com sucesso." });
    
    try {
      await dbUpdateHabit(updatedHabit);
    } catch (error) {
      console.error("Failed to update habit:", error);
      toast({ title: "Erro", description: "Falha ao atualizar hábito. Revertendo.", variant: "destructive" });
      // Rollback
      setHabits(originalHabits);
    }
  };

  const removeHabit = async (habitId: string) => {
    const originalHabits = habits;
    const originalLogs = habitLogs;

    // Otimista
    setHabits(prev => prev.filter(h => h.id !== habitId));
    setHabitLogs(prev => prev.filter(l => l.habitId !== habitId));
    toast({ title: "Sucesso", description: "Hábito excluído com sucesso." });
    
    try {
      await dbDeleteHabit(habitId);
    } catch (error) {
      console.error("Failed to delete habit:", error);
      toast({ title: "Erro", description: "Falha ao excluir hábito. Revertendo.", variant: "destructive" });
      // Rollback
      setHabits(originalHabits);
      setHabitLogs(originalLogs);
    }
  };

  const completeHabit = async (habitId: string, date: Date = new Date(), notes?: string) => {
    const dateString = format(date, "yyyy-MM-dd");
    const existingLog = habitLogs.find(log => log.habitId === habitId && log.date === dateString);

    if (existingLog) {
      // Desmarcar - Otimista
      setHabitLogs(prev => prev.filter(log => log.id !== existingLog.id));
      toast({ title: "Hábito Desmarcado", description: "Hábito marcado como não concluído." });
      
      try {
        await dbDeleteHabitLog(existingLog.id);
      } catch (error) {
        console.error("Failed to delete habit log:", error);
        toast({ title: "Erro", description: "Falha ao desmarcar. Revertendo.", variant: "destructive" });
        // Rollback
        setHabitLogs(prev => [...prev, existingLog]);
      }

    } else {
      // Marcar - Otimista
      const newLog: HabitLog = {
        id: generateUUID(), // ID temporário
        habitId,
        date: dateString,
        completedAt: Date.now(),
        ...(notes && { notes }),
      };
      setHabitLogs(prev => [...prev, newLog]);
      toast({ title: "Ótimo trabalho!", description: `Hábito concluído${notes ? ' com nota' : ''}.`, className: "bg-success text-success-foreground" });
      
      try {
        const savedLog = await dbLogHabitCompletion(habitId, dateString, notes);
         // Atualiza o log com o ID real do DB
        setHabitLogs(prev => prev.map(l => l.id === newLog.id ? savedLog : l));
      } catch (error) {
        console.error("Failed to log habit completion:", error);
        toast({ title: "Erro", description: "Falha ao concluir hábito. Desfazendo.", variant: "destructive" });
        // Rollback
        setHabitLogs(prev => prev.filter(l => l.id !== newLog.id));
      }
    }
  };

  const updateLogNotes = async (logId: string, newNotes: string | undefined) => {
      const originalLogs = habitLogs;
      const logToUpdate = habitLogs.find(log => log.id === logId);
      if (!logToUpdate) return;
      
      const updatedLog = { ...logToUpdate, notes: newNotes };
      
      // Otimista
      setHabitLogs(prev => prev.map(l => l.id === logId ? updatedLog : l));
      toast({ title: "Sucesso", description: "Nota atualizada." });
      
      try {
        await dbUpdateHabitLog(updatedLog);
      } catch (error) {
        console.error("Failed to update log notes:", error);
        toast({ title: "Erro", description: "Falha ao salvar nota. Revertendo.", variant: "destructive" });
        // Rollback
        setHabitLogs(originalLogs);
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

  return {
    habits,
    habitLogs,
    achievedMedals,
    isLoading: isUserLoading || isLoading,
    createHabit,
    editHabit,
    removeHabit,
    completeHabit,
    isHabitCompletedToday,
    getCompletionsForHabitOnDate,
    updateLogNotes,
  };
}
