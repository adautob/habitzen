
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
          dbGetHabits(user.uid),
          dbGetHabitLogs(user.uid),
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
    
    const tempId = generateUUID();
    const newHabit: Habit = {
      id: tempId,
      createdAt: Date.now(),
      points: POINTS_PER_DIFFICULTY[formData.difficulty],
      ...formData,
    };
    setHabits(prev => [newHabit, ...prev].sort((a, b) => b.createdAt - a.createdAt));
    toast({ title: "Sucesso", description: "Hábito criado com sucesso." });
    
    try {
      const newId = await dbAddHabit(user.uid, formData);
      setHabits(prev => prev.map(h => (h.id === tempId ? { ...h, id: newId } : h)));
    } catch (error) {
      console.error("Failed to create habit:", error);
      toast({ title: "Erro", description: "Falha ao salvar hábito. Desfazendo.", variant: "destructive" });
      setHabits(prev => prev.filter(h => h.id !== tempId));
    }
  };

  const editHabit = async (habitId: string, formData: HabitFormData) => {
    if (!user) return;
    const originalHabits = habits;
    const habitToUpdate = habits.find(h => h.id === habitId);
    if (!habitToUpdate) return;
    
    const updatedHabit = { 
        ...habitToUpdate, 
        ...formData,
        points: POINTS_PER_DIFFICULTY[formData.difficulty]
    };

    setHabits(prev => prev.map(h => h.id === habitId ? updatedHabit : h));
    toast({ title: "Sucesso", description: "Hábito atualizado com sucesso." });
    
    try {
      await dbUpdateHabit(user.uid, updatedHabit);
    } catch (error) {
      console.error("Failed to update habit:", error);
      toast({ title: "Erro", description: "Falha ao atualizar hábito. Revertendo.", variant: "destructive" });
      setHabits(originalHabits);
    }
  };

  const removeHabit = async (habitId: string) => {
    if (!user) return;
    const originalHabits = habits;
    const originalLogs = habitLogs;

    setHabits(prev => prev.filter(h => h.id !== habitId));
    setHabitLogs(prev => prev.filter(l => l.habitId !== habitId));
    toast({ title: "Sucesso", description: "Hábito excluído com sucesso." });
    
    try {
      await dbDeleteHabit(user.uid, habitId);
    } catch (error) {
      console.error("Failed to delete habit:", error);
      toast({ title: "Erro", description: "Falha ao excluir hábito. Revertendo.", variant: "destructive" });
      setHabits(originalHabits);
      setHabitLogs(originalLogs);
    }
  };

  const completeHabit = async (habitId: string, date: Date = new Date(), notes?: string) => {
    if (!user) return;
    const dateString = format(date, "yyyy-MM-dd");
    const existingLog = habitLogs.find(log => log.habitId === habitId && log.date === dateString);

    if (existingLog) {
      const originalLogs = habitLogs;
      setHabitLogs(prev => prev.filter(log => log.id !== existingLog.id));
      toast({ title: "Hábito Desmarcado", description: "Hábito marcado como não concluído." });
      
      try {
        await dbDeleteHabitLog(user.uid, existingLog.id);
      } catch (error) {
        console.error("Failed to delete habit log:", error);
        toast({ title: "Erro", description: "Falha ao desmarcar. Revertendo.", variant: "destructive" });
        setHabitLogs(originalLogs);
      }

    } else {
      const tempId = generateUUID();
      const newLog: HabitLog = {
        id: tempId,
        habitId,
        date: dateString,
        completedAt: Date.now(),
        ...(notes && { notes }),
      };
      setHabitLogs(prev => [...prev, newLog]);
      toast({ title: "Ótimo trabalho!", description: `Hábito concluído${notes ? ' com nota' : ''}.`, className: "bg-success text-success-foreground" });
      
      try {
        const savedLog = await dbLogHabitCompletion(user.uid, habitId, dateString, notes);
        setHabitLogs(prev => prev.map(l => l.id === tempId ? savedLog : l));
      } catch (error) {
        console.error("Failed to log habit completion:", error);
        toast({ title: "Erro", description: "Falha ao concluir hábito. Desfazendo.", variant: "destructive" });
        setHabitLogs(prev => prev.filter(l => l.id !== tempId));
      }
    }
  };

  const updateLogNotes = async (logId: string, newNotes: string | undefined) => {
      if (!user) return;
      const originalLogs = habitLogs;
      const logToUpdate = habitLogs.find(log => log.id === logId);
      if (!logToUpdate) return;
      
      const updatedLog = { ...logToUpdate, notes: newNotes };
      
      setHabitLogs(prev => prev.map(l => l.id === logId ? updatedLog : l));
      toast({ title: "Sucesso", description: "Nota atualizada." });
      
      try {
        await dbUpdateHabitLog(user.uid, updatedLog);
      } catch (error) {
        console.error("Failed to update log notes:", error);
        toast({ title: "Erro", description: "Falha ao salvar nota. Revertendo.", variant: "destructive" });
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
