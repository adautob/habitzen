"use client";
import { Button } from "@/components/ui/button";
import { AddHabitDialog } from "@/components/AddHabitDialog";
import { HabitList } from "@/components/HabitList";
import { DashboardStats } from "@/components/DashboardStats";
import { CompletionCalendar } from "@/components/CompletionCalendar";
import { HabitCompletionPieChart } from "@/components/HabitCompletionPieChart";
import { useHabitData } from "@/hooks/useHabitData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListChecks, LayoutDashboard, PlusCircle } from "lucide-react";

export default function HabitZenPage() {
  const {
    habits,
    habitLogs,
    isLoading,
    createHabit,
    editHabit,
    removeHabit,
    completeHabit,
    isHabitCompletedToday,
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

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 sm:w-auto sm:grid-cols-2">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="habits" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Meus Hábitos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <DashboardStats habits={habits} habitLogs={habitLogs} isLoading={isLoading} />
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <CompletionCalendar habits={habits} habitLogs={habitLogs} isLoading={isLoading} />
            <HabitCompletionPieChart habits={habits} habitLogs={habitLogs} isLoading={isLoading} />
          </div>
        </TabsContent>

        <TabsContent value="habits">
          <HabitList
            habits={habits}
            isLoading={isLoading}
            isHabitCompletedToday={isHabitCompletedToday}
            onCompleteHabit={completeHabit}
            onEditHabit={editHabit}
            onDeleteHabit={removeHabit}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
