
"use client";
import type { Habit, HabitLog } from "@/types";
import { getHabitHeatmapData, type HeatmapCell, type HeatmapData } from "@/lib/gamification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HabitConsistencyHeatmapProps {
  habit: Habit;
  habitLogs: HabitLog[]; // Logs specific to this habit
}

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function HabitConsistencyHeatmap({ habit, habitLogs }: HabitConsistencyHeatmapProps) {
  const heatmapData = getHabitHeatmapData(habit.id, habitLogs);

  if (!heatmapData || heatmapData.weeks.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        Ainda não há dados suficientes para exibir o mapa de consistência.
      </div>
    );
  }
  
  const getCellColor = (level: number, date: string) => {
    if (!date) return "bg-background"; // Empty cell for padding
    if (level === 0) return "bg-muted/50 hover:bg-muted"; // Not completed
    // For now, only one level of completion
    return "bg-success/70 hover:bg-success"; // Completed
  };


  return (
    <TooltipProvider delayDuration={50}>
      <div className="flex flex-col items-center">
        <div className="flex w-full justify-around mb-1 text-xs text-muted-foreground px-6">
            {heatmapData.monthLabels.map(({ month, weekIndex }) => (
                 <div key={`${month}-${weekIndex}`} style={{ position: 'relative', left: `${weekIndex * (100 / heatmapData.weeks.length)}%` }} className="absolute text-center">
                    {month}
                </div>
            ))}
        </div>
        <div className="flex gap-1.5">
          <div className="flex flex-col gap-1 text-xs text-muted-foreground mr-1 justify-around py-1.5">
            <div></div> {/* Spacer for month labels */}
            {DAY_LABELS[1]} {/* Seg */}
            <div></div>
            {DAY_LABELS[3]} {/* Qua */}
            <div></div>
            {DAY_LABELS[5]} {/* Sex */}
            <div></div>
          </div>
          <div className="grid grid-flow-col gap-1">
            {heatmapData.weeks.map((week, weekIdx) => (
              <div key={`week-${weekIdx}`} className="grid grid-rows-7 gap-1">
                {week.map((day, dayIdx) => (
                  <Tooltip key={`day-${weekIdx}-${dayIdx}`}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "h-4 w-4 rounded-sm",
                          getCellColor(day.level, day.date)
                        )}
                      />
                    </TooltipTrigger>
                    {day.date && (
                       <TooltipContent side="top">
                        <p>
                          {day.count > 0 ? `${day.count} conclusão(ões)` : "Nenhuma conclusão"} em{" "}
                          {format(parseISO(day.date), "PPP", { locale: ptBR })}
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </div>
         <div className="flex items-center space-x-2 mt-4 text-xs text-muted-foreground">
            <span>Menos</span>
            <div className="h-3 w-3 rounded-sm bg-muted/50"></div>
            <div className="h-3 w-3 rounded-sm bg-success/30"></div>
            <div className="h-3 w-3 rounded-sm bg-success/50"></div>
            <div className="h-3 w-3 rounded-sm bg-success/70"></div>
            <div className="h-3 w-3 rounded-sm bg-success"></div>
            <span>Mais</span>
        </div>
      </div>
    </TooltipProvider>
  );
}
