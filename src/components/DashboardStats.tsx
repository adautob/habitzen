"use client";
import type { Habit, HabitLog } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Zap, Trophy, CheckSquare, BarChartBig, Percent } from "lucide-react";
import { getOverallStats } from "@/lib/gamification";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStatsProps {
  habits: Habit[];
  habitLogs: HabitLog[];
  isLoading: boolean;
}

export function DashboardStats({ habits, habitLogs, isLoading }: DashboardStatsProps) {
  if (isLoading) {
    return <StatsSkeleton />;
  }
  
  const stats = getOverallStats(habits, habitLogs);

  const statItems = [
    { title: "Total de Hábitos", value: stats.totalHabits, icon: BarChartBig, color: "text-primary" },
    { title: "Total de Conclusões", value: stats.totalCompletions, icon: CheckSquare, color: "text-success" },
    { title: "Total de Pontos", value: stats.totalPoints, icon: Zap, color: "text-amber-500" },
    { title: "Sequência Atual", value: `${stats.currentOverallStreak} ${stats.currentOverallStreak === 1 ? "dia" : "dias"}`, icon: TrendingUp, color: "text-orange-500" },
    { title: "Maior Sequência", value: `${stats.longestOverallStreak} ${stats.longestOverallStreak === 1 ? "dia" : "dias"}`, icon: Trophy, color: "text-yellow-600" },
    { title: "Taxa de Sucesso (30d)", value: `${stats.successRate}%`, icon: Percent, color: "text-teal-500" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statItems.map((item) => (
        <Card key={item.title} className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.title}
            </CardTitle>
            <item.icon className={`h-5 w-5 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            {/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> */}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-1/3 mb-1" />
            <Skeleton className="h-3 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
