"use client";
import type { Habit, HabitFormData } from "@/types";
import { HabitItem } from "./HabitItem";
import { Skeleton } from "./ui/skeleton";
import Image from 'next/image';

interface HabitListProps {
  habits: Habit[];
  isLoading: boolean;
  isHabitCompletedToday: (habitId: string) => boolean;
  onCompleteHabit: (habitId: string) => void;
  onEditHabit: (habitId: string, data: HabitFormData) => Promise<void>;
  onDeleteHabit: (habitId: string) => void;
}

export function HabitList({
  habits,
  isLoading,
  isHabitCompletedToday,
  onCompleteHabit,
  onEditHabit,
  onDeleteHabit,
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
          src="https://picsum.photos/seed/habitzen-empty/300/200" 
          alt="Nenhum hábito ainda" 
          width={200} 
          height={133}
          className="mb-4 rounded-md"
          data-ai-hint="jardim zen ilustração" 
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
      {habits.map((habit) => (
        <HabitItem
          key={habit.id}
          habit={habit}
          isHabitCompletedToday={isHabitCompletedToday(habit.id)}
          onComplete={onCompleteHabit}
          onEdit={onEditHabit}
          onDelete={onDeleteHabit}
        />
      ))}
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
