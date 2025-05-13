"use client";
import type { Habit, HabitLog } from "@/types";
import { useState, useMemo } from "react";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
// Import DayProps, Day (as RdpDay), and DayContent (as RdpDayContent) from react-day-picker
import type { DayProps } from "react-day-picker";
import { Day as RdpDay, DayContent as RdpDayContent } from "react-day-picker";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isSameDay } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

interface CompletionCalendarProps {
  habits: Habit[];
  habitLogs: HabitLog[];
  isLoading: boolean;
}

export function CompletionCalendar({ habits, habitLogs, isLoading }: CompletionCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const completedHabitsByDate = useMemo(() => {
    const map = new Map<string, { habit: Habit; log: HabitLog }[]>();
    habitLogs.forEach(log => {
      const habit = habits.find(h => h.id === log.habitId);
      if (habit) {
        const entries = map.get(log.date) || [];
        entries.push({ habit, log });
        map.set(log.date, entries);
      }
    });
    return map;
  }, [habitLogs, habits]);

  const modifiers = useMemo(() => {
    const completedDays: Record<string, Date[]> = {};
    habitLogs.forEach(log => {
      const dateStr = format(new Date(log.date), "yyyy-MM-dd");
      if (!completedDays[dateStr]) {
        completedDays[dateStr] = [];
      }
      completedDays[dateStr].push(new Date(log.date + 'T00:00:00')); 
    });
    
    return {
      completed: Object.values(completedDays).flat().filter((date, index, self) => 
        index === self.findIndex(d => isSameDay(d, date))
      ),
    };
  }, [habitLogs]);

  const modifiersClassNames = {
    completed: "bg-success/20 text-success-foreground rounded-md", // This will apply to the RdpDay button
    // selected: "bg-primary text-primary-foreground", // Default DayPicker selection styling is usually sufficient
  };

  const selectedDayCompletions = selectedDate 
    ? completedHabitsByDate.get(format(selectedDate, "yyyy-MM-dd")) || [] 
    : [];

  const Footer = () => {
    if (!selectedDate) return <p className="text-sm text-muted-foreground p-2">Selecione um dia para ver os hábitos concluídos.</p>;
    if (selectedDayCompletions.length === 0) return <p className="text-sm text-muted-foreground p-2">Nenhum hábito concluído em {format(selectedDate, "PPP", { locale: ptBR })}.</p>;
    
    return (
      <div className="p-2">
        <h4 className="font-semibold mb-1">Concluído em {format(selectedDate, "PPP", { locale: ptBR })}:</h4>
        <ul className="list-disc list-inside text-sm space-y-0.5 max-h-24 overflow-y-auto">
          {selectedDayCompletions.map(({ habit }) => (
            <li key={habit.id}>{habit.name}</li>
          ))}
        </ul>
      </div>
    );
  };

  // Custom DayContent component to include dots
  const CustomDayContentWithDots = (dayContentProps: DayProps) => {
    const { date } = dayContentProps;
    const dateString = format(date, "yyyy-MM-dd");
    // Access completedHabitsByDate from the outer scope
    const completions = completedHabitsByDate.get(dateString) || [];

    return (
      // Relative positioning for the dots within the day cell's content
      <div className="relative w-full h-full flex items-center justify-center">
        <RdpDayContent {...dayContentProps} /> {/* Renders the default day number */}
        {completions.length > 0 && (
          <>
            <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-success pointer-events-none"></span>
            <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-success animate-ping pointer-events-none"></span>
          </>
        )}
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Calendário de Conclusão</CardTitle></CardHeader>
        <CardContent className="h-[350px] flex justify-center items-center">
          <Skeleton className="w-full max-w-xs h-[300px] rounded-md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle>Calendário de Conclusão</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <ShadcnCalendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          className="rounded-md border"
          locale={ptBR}
          footer={<Footer />}
          components={{
            Day: (dayComponentProps: DayProps) => { // This is our custom Day cell renderer
              const { date } = dayComponentProps;
              const dateString = format(date, "yyyy-MM-dd");
              const completions = completedHabitsByDate.get(dateString) || [];

              // BaseDayElement uses the default RdpDay (button) but with our CustomDayContentWithDots
              const BaseDayElementWithDots = (
                <RdpDay
                  {...dayComponentProps}
                  // Pass our custom DayContent component to RdpDay
                  components={{ DayContent: CustomDayContentWithDots }}
                />
              );

              if (completions.length > 0) {
                // If there are completions, wrap the day cell with a Popover
                return (
                  <Popover>
                    <PopoverTrigger asChild>
                      {BaseDayElementWithDots}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2 text-sm" side="top" align="center">
                      <p className="font-semibold mb-1">Concluído em {format(date, "PPP", { locale: ptBR })}:</p>
                      <ul className="list-none space-y-0.5">
                        {completions.map(({ habit }) => (
                          <li key={habit.id} className="text-xs">{habit.name}</li>
                        ))}
                      </ul>
                    </PopoverContent>
                  </Popover>
                );
              }
              // If no completions, just render the day cell (with dots if any, handled by CustomDayContentWithDots)
              return BaseDayElementWithDots;
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
