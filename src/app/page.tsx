
"use client";
import { Button } from "@/components/ui/button";
import { AddHabitDialog } from "@/components/AddHabitDialog";
import { HabitList } from "@/components/HabitList";
import { DashboardStats } from "@/components/DashboardStats";
import { CompletionCalendar } from "@/components/CompletionCalendar";
import { HabitCompletionPieChart } from "@/components/HabitCompletionPieChart";
import { SuccessRateTrendChart } from "@/components/SuccessRateTrendChart";
import { AchievementsTab } from "@/components/AchievementsTab";
import { useHabitData } from "@/hooks/useHabitData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListChecks, LayoutDashboard, PlusCircle, Trophy } from "lucide-react";

export default function HabitZenPage() {
  const {
    habits,
    habitLogs,
    achievedMedals,
    isLoading,
    createHabit,
    editHabit,
    removeHabit,
    completeHabit,
    isHabitCompletedToday,
    updateLogNotes,
  } = useHabitData();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Meu Painel de Hábitos</h2>
          <p className="text-muted-foreground">
            Acompanhe seu progresso e construa hábitos duradouros.
          </p>
        </div>
        <AddHabitDialog
          onSave={async (data, habitId) => {
            if (habitId) {
              await editHabit(habitId, data);
            } else {
              await createHabit(data);
            }
          }}
          triggerButton={
             <Button size="lg" className="shadow-md hover:shadow-lg transition-shadow">
                <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Novo Hábito
              </Button>
          }
        />
      </div>

      <Tabs defaultValue="dashboard" className="sm:space-y-6">
        <TabsList className="grid w-full grid-cols-1 bg-background py-1 shadow-sm sm:shadow-none sm:bg-muted sm:p-1 sm:w-auto sm:grid-cols-3 sticky top-0 z-20 sm:relative sm:top-auto sm:z-auto">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="habits" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Meus Hábitos
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Conquistas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-28 space-y-6 sm:mt-0">
          <DashboardStats habits={habits} habitLogs={habitLogs} isLoading={isLoading} />
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <CompletionCalendar habits={habits} habitLogs={habitLogs} isLoading={isLoading} />
            <HabitCompletionPieChart habits={habits} habitLogs={habitLogs} isLoading={isLoading} />
          </div>
           <SuccessRateTrendChart habits={habits} habitLogs={habitLogs} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="habits" className="mt-28 sm:mt-0">
          <HabitList
            habits={habits}
            habitLogs={habitLogs} 
            isLoading={isLoading}
            isHabitCompletedToday={isHabitCompletedToday}
            onCompleteHabit={completeHabit}
            onEditHabit={editHabit}
            onDeleteHabit={removeHabit}
            onUpdateLogNotes={updateLogNotes}
          />
        </TabsContent>
         <TabsContent value="achievements" className="mt-28 sm:mt-0">
          <AchievementsTab achievedMedals={achievedMedals} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
