"use client";
import type { Habit, HabitLog } from "@/types";
import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isSameDay } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
      const dateStr = format(new Date(log.date), "yyyy-MM-dd"); // Ensure consistent formatting
      if (!completedDays[dateStr]) {
        completedDays[dateStr] = [];
      }
      // Add the actual Date object for react-day-picker
      completedDays[dateStr].push(new Date(log.date + 'T00:00:00')); // Ensure correct date object without timezone issues for matching
    });
    
    return {
      completed: Object.values(completedDays).flat().filter((date, index, self) => 
        index === self.findIndex(d => isSameDay(d, date))
      ),
    };
  }, [habitLogs]);

  const modifiersClassNames = {
    completed: "bg-success/20 text-success-foreground rounded-md",
    selected: "bg-primary text-primary-foreground",
  };

  const selectedDayCompletions = selectedDate 
    ? completedHabitsByDate.get(format(selectedDate, "yyyy-MM-dd")) || [] 
    : [];

  if (isLoading) {
    // Basic skeleton for calendar, or can be more elaborate
    return <Card><CardHeader><CardTitle>Completion Calendar</CardTitle></CardHeader><CardContent className="h-[350px] animate-pulse bg-muted rounded-md"></CardContent></Card>;
  }
  
  const Footer = () => {
    if (!selectedDate) return <p className="text-sm text-muted-foreground p-2">Select a day to see completed habits.</p>;
    if (selectedDayCompletions.length === 0) return <p className="text-sm text-muted-foreground p-2">No habits completed on {format(selectedDate, "PPP")}.</p>;
    
    return (
      <div className="p-2">
        <h4 className="font-semibold mb-1">Completed on {format(selectedDate, "PPP")}:</h4>
        <ul className="list-disc list-inside text-sm space-y-0.5 max-h-24 overflow-y-auto">
          {selectedDayCompletions.map(({ habit }) => (
            <li key={habit.id}>{habit.name}</li>
          ))}
        </ul>
      </div>
    );
  };


  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle>Completion Calendar</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          className="rounded-md border"
          footer={<Footer />}
          components={{
            Day: ({ date, displayMonth }) => {
              const dateString = format(date, "yyyy-MM-dd");
              const completionsOnDate = completedHabitsByDate.get(dateString) || [];
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const originalDay = <Calendar.Day date={date} displayMonth={displayMonth} />;

              if (completionsOnDate.length > 0) {
                return (
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="relative">
                        {originalDay}
                        <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-success animate-ping"></span>
                        <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-success"></span>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2 text-sm">
                      <p className="font-semibold mb-1">Completed on {format(date, "PPP")}:</p>
                      <ul className="list-none space-y-0.5">
                        {completionsOnDate.map(({ habit }) => (
                          <li key={habit.id} className="text-xs">{habit.name}</li>
                        ))}
                      </ul>
                    </PopoverContent>
                  </Popover>
                );
              }
              return originalDay;
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
