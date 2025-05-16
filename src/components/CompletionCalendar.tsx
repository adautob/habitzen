
"use client";
import type { Habit, HabitLog } from "@/types";
import { useState, useMemo } from "react";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
// Import DayProps, Day (as RdpDay), and DayContent (as RdpDayContent) from react-day-picker
import type { DayProps } from "react-day-picker";
import { Day as RdpDay, DayContent as RdpDayContent } from "react-day-picker";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isSameDay, parseISO } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      const dateStr = format(parseISO(log.date), "yyyy-MM-dd"); // Ensure date from log is parsed correctly
      if (!completedDays[dateStr]) {
        completedDays[dateStr] = [];
      }
      completedDays[dateStr].push(parseISO(log.date + 'T00:00:00'));
    });
    
    return {
      completed: Object.values(completedDays).flat().filter((date, index, self) => 
        index === self.findIndex(d => isSameDay(d, date))
      ),
    };
  }, [habitLogs]);

  const modifiersClassNames = {
    completed: "bg-success/20 text-success-foreground rounded-md",
  };

  const selectedDayCompletions = selectedDate 
    ? completedHabitsByDate.get(format(selectedDate, "yyyy-MM-dd")) || [] 
    : [];

  const Footer = () => {
    if (!selectedDate) return <p className="text-sm text-muted-foreground p-2">Selecione um dia para ver os hábitos concluídos.</p>;
    if (selectedDayCompletions.length === 0) return <p className="text-sm text-muted-foreground p-2">Nenhum hábito concluído em {format(selectedDate, "PPP", { locale: ptBR })}.</p>;
    
    return (
      <ScrollArea className="h-32 p-2">
        <h4 className="font-semibold mb-1">Concluído em {format(selectedDate, "PPP", { locale: ptBR })}:</h4>
        <ul className="list-none text-sm space-y-1.5">
          {selectedDayCompletions.map(({ habit, log }) => (
            <li key={habit.id}>
              <span className="font-medium">{habit.name}</span>
              {log.notes && <p className="text-xs text-muted-foreground pl-2">- "{log.notes}"</p>}
            </li>
          ))}
        </ul>
      </ScrollArea>
    );
  };

  const CustomDayContentWithDots = (dayContentProps: DayProps) => {
    const { date } = dayContentProps;
    const dateString = format(date, "yyyy-MM-dd");
    const completions = completedHabitsByDate.get(dateString) || [];

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <RdpDayContent {...dayContentProps} />
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
        <CardContent className="h-[400px] flex justify-center items-center">
          <Skeleton className="w-full max-w-xs h-[350px] rounded-md" />
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
            Day: (dayComponentProps: DayProps) => {
              const { date } = dayComponentProps;
              const dateString = format(date, "yyyy-MM-dd");
              const completions = completedHabitsByDate.get(dateString) || [];

              const BaseDayElementWithDots = (
                <RdpDay
                  {...dayComponentProps}
                  components={{ DayContent: CustomDayContentWithDots }}
                />
              );

              if (completions.length > 0) {
                return (
                  <Popover>
                    <PopoverTrigger asChild>
                      {BaseDayElementWithDots}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 text-sm" side="top" align="center">
                      <ScrollArea className="max-h-48 w-64 p-2">
                        <p className="font-semibold mb-1.5">Concluído em {format(date, "PPP", { locale: ptBR })}:</p>
                        <ul className="list-none space-y-1">
                          {completions.map(({ habit, log }) => (
                            <li key={habit.id}>
                              <span className="font-medium text-xs">{habit.name}</span>
                              {log.notes && <p className="text-xs text-muted-foreground pl-1.5">- "{log.notes}"</p>}
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                );
              }
              return BaseDayElementWithDots;
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
