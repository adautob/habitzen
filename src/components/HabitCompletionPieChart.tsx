"use client";
import type { Habit, HabitLog } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { getPieChartData } from "@/lib/gamification";
import { Skeleton } from "@/components/ui/skeleton";

interface HabitCompletionPieChartProps {
  habits: Habit[];
  habitLogs: HabitLog[];
  isLoading: boolean;
}

const chartConfig = {
  completed: {
    label: "Concluídos",
    color: "hsl(var(--success))",
  },
  missed: {
    label: "Perdidos",
    color: "hsl(var(--destructive))",
  },
  nodata: {
    label: "Sem Dados",
    color: "hsl(var(--muted))",
  }
} as const;

export function HabitCompletionPieChart({ habits, habitLogs, isLoading }: HabitCompletionPieChartProps) {
  const data = getPieChartData(habits, habitLogs, 7); // Last 7 days for daily habits

  if (isLoading) {
    return <Card><CardHeader><CardTitle>Conclusão de Hábitos Diários (Últimos 7 Dias)</CardTitle><CardDescription>Carregando dados do gráfico...</CardDescription></CardHeader><CardContent className="flex justify-center items-center h-[250px]"><Skeleton className="h-[200px] w-[200px] rounded-full" /></CardContent></Card>;
  }
  
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  if (total === 0 || (data.length === 1 && (data[0].name === "Sem Hábitos Diários" || data[0].name === "Sem Atividade"))) { // Adjusted for translated keys from getPieChartData
     return (
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Conclusão de Hábitos Diários (Últimos 7 Dias)</CardTitle>
          <CardDescription>{data[0]?.name === "Sem Hábitos Diários" ? "Adicione alguns hábitos diários para ver o progresso." : "Nenhuma atividade registrada para hábitos diários nos últimos 7 dias."}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[250px]">
          <p className="text-muted-foreground">Sem dados para exibir</p>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="flex flex-col shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle>Conclusão de Hábitos Diários (Últimos 7 Dias)</CardTitle>
        <CardDescription>Proporção de hábitos diários concluídos vs. perdidos.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
             <ChartLegend
                content={<ChartLegendContent nameKey="name" />}
                className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/3 [&>*]:justify-center"
              />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
