
"use client";
import type { Habit, HabitFormData, HabitLog } from "@/types";
import { HabitItem } from "./HabitItem";
import { Skeleton } from "./ui/skeleton";
import Image from 'next/image';
import { format } from "date-fns";

interface HabitListProps {
  habits: Habit[];
  habitLogs: HabitLog[];
  isLoading: boolean;
  isHabitCompletedToday: (habitId: string, date?: Date) => HabitLog | undefined; // Returns log or undefined
  onCompleteHabit: (habitId: string, date?: Date, notes?: string) => void;
  onEditHabit: (habitId: string, data: HabitFormData) => Promise<void>;
  onDeleteHabit: (habitId: string) => void;
  onUpdateLogNotes: (logId: string, notes: string | undefined) => Promise<void>;
}

export function HabitList({
  habits,
  habitLogs,
  isLoading,
  isHabitCompletedToday,
  onCompleteHabit,
  onEditHabit,
  onDeleteHabit,
  onUpdateLogNotes,
}: HabitListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <Image
          src="https://placehold.co/200x133.png"
          alt="Nenhum hábito ainda"
          width={200}
          height={133}
          className="mb-4 rounded-md"
          data-ai-hint="zen garden"
        />
        <h3 className="text-xl font-semibold">Nenhum Hábito Ainda!</h3>
        <p className="text-muted-foreground">
          Comece a construir rotinas positivas adicionando seu primeiro hábito.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {habits
        .filter(habit => habit && habit.id) // Garante que o hábito e seu ID são válidos
        .map((habit) => {
          const todayLog = isHabitCompletedToday(habit.id);
          // Garante que cada log é válido antes de tentar acessar log.habitId
          const logsForThisHabit = habitLogs.filter(log => log && log.habitId === habit.id);
          return (
            <HabitItem
              key={habit.id}
              habit={habit}
              habitLogs={logsForThisHabit}
              todayLog={todayLog}
              onComplete={onCompleteHabit}
              onEdit={onEditHabit}
              onDelete={onDeleteHabit}
              onUpdateLogNotes={onUpdateLogNotes}
            />
          );
        })}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="flex flex-col space-y-3 p-4 border rounded-lg shadow">
      <Skeleton className="h-[20px] w-[150px] rounded-md" />
      <Skeleton className="h-[16px] w-[100px] rounded-md" />
      <div className="space-y-2 pt-4">
        <Skeleton className="h-[16px] w-full rounded-md" />
        <Skeleton className="h-[16px] w-[80px] rounded-md" />
      </div>
      <Skeleton className="h-[40px] w-full rounded-md mt-2" />
    </div>
  );
}
