
"use client";
import type { Habit, HabitLog } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { getSuccessRateTrend } from "@/lib/gamification";
import { Skeleton } from "@/components/ui/skeleton";

interface SuccessRateTrendChartProps {
  habits: Habit[];
  habitLogs: HabitLog[];
  isLoading: boolean;
}

const chartConfig = {
  taxaSucesso: {
    label: "Taxa de Sucesso (%)",
    color: "hsl(var(--primary))",
  },
} as const;

export function SuccessRateTrendChart({ habits, habitLogs, isLoading }: SuccessRateTrendChartProps) {
  // Get weekly trend for the last 4 weeks
  const trendData = isLoading ? [] : getSuccessRateTrend(habits, habitLogs, 6, 'weekly');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tendência da Taxa de Sucesso Semanal</CardTitle>
          <CardDescription>Carregando dados do gráfico...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex justify-center items-center">
          <Skeleton className="w-full h-[250px] rounded-md" />
        </CardContent>
      </Card>
    );
  }
  
  if (trendData.length === 0 || trendData.every(d => d.taxaSucesso === 0)) {
     return (
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Tendência da Taxa de Sucesso Semanal</CardTitle>
          <CardDescription>Acompanhe a evolução da sua taxa de sucesso para hábitos diários.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[300px]">
          <p className="text-muted-foreground text-center">
            Sem dados suficientes para exibir a tendência.<br/>
            Adicione e complete hábitos diários para ver seu progresso.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle>Tendência da Taxa de Sucesso Semanal</CardTitle>
        <CardDescription>Evolução da taxa de conclusão de hábitos diários nas últimas semanas.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <LineChart
            accessibilityLayer
            data={trendData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 15)} // Shorten week names if too long
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
            />
            <Line
              dataKey="taxaSucesso"
              type="monotone"
              stroke={chartConfig.taxaSucesso.color}
              strokeWidth={2}
              dot={{
                fill: chartConfig.taxaSucesso.color,
              }}
              activeDot={{
                r: 6,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
