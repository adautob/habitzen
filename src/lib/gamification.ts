import type { Habit, HabitLog } from "@/types";
import { differenceInCalendarDays, eachDayOfInterval, format, subDays, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

export function calculatePoints(logs: HabitLog[], habits: Habit[]): number {
  let totalPoints = 0;
  const habitMap = new Map(habits.map(h => [h.id, h]));

  for (const log of logs) {
    const habit = habitMap.get(log.habitId);
    if (habit) {
      totalPoints += habit.points;
    }
  }
  return totalPoints;
}

export function calculateCurrentStreak(habit: Habit, logs: HabitLog[]): number {
  if (!logs || logs.length === 0) return 0;

  const sortedLogs = logs
    .filter(log => log.habitId === habit.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sortedLogs.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();

  // If last completion was not today or yesterday (for daily), streak is 0
  if (habit.frequency === "daily") {
    const lastLogDate = new Date(sortedLogs[0].date);
    if (differenceInCalendarDays(currentDate, lastLogDate) > 1) {
      return 0;
    }
    // If completed today, it counts
    if (differenceInCalendarDays(currentDate, lastLogDate) === 0) {
        streak = 1;
        currentDate = subDays(currentDate, 1); // Start checking from yesterday
    } else if (differenceInCalendarDays(currentDate, lastLogDate) === 1) {
        // Completed yesterday
        streak = 1;
        currentDate = subDays(currentDate, 1); // Start checking from the day before yesterday
    }


    for (let i = (differenceInCalendarDays(new Date(), lastLogDate) === 0 ? 1:0) ; i < sortedLogs.length; i++) {
      const logDate = new Date(sortedLogs[i].date);
      if (differenceInCalendarDays(currentDate, logDate) === 0) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else {
        break; // Streak broken
      }
    }
  } else if (habit.frequency === "weekly") {
    // For weekly, check if completed in the current week, then previous week, etc.
    // This is a simplified version: counts consecutive weeks of completion.
    let currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    
    // Check if completed this week
    const completedThisWeek = sortedLogs.some(log => 
        isWithinInterval(new Date(log.date), { start: currentWeekStart, end: endOfWeek(currentDate, { weekStartsOn: 1 }) })
    );

    if (completedThisWeek) {
        streak = 1;
        let previousWeekStart = startOfWeek(subDays(currentWeekStart, 1), { weekStartsOn: 1 });
        for (let i = 0; i < sortedLogs.length; i++) { // Check all logs
            const logDate = new Date(sortedLogs[i].date);
            if (isWithinInterval(logDate, { start: previousWeekStart, end: endOfWeek(previousWeekStart, {weekStartsOn: 1}) })) {
                streak++;
                previousWeekStart = startOfWeek(subDays(previousWeekStart, 1), { weekStartsOn: 1 });
                 // Ensure we don't double count for the same week if multiple logs exist
                i = sortedLogs.findIndex(sl => new Date(sl.date) < previousWeekStart) -1; 
                if (i < -1) break; // All remaining logs are older
            } else if (logDate < previousWeekStart) {
                 // If a log is older than the current week we are checking, and it wasn't in that week, the streak might be broken or this log is for an even older week.
                 // If no completion found for previousWeekStart, and logDate is older, break.
                 if (!isWithinInterval(logDate, { start: previousWeekStart, end: endOfWeek(previousWeekStart, { weekStartsOn: 1 }) })) {
                    const isLogForEarlierWeek = logDate < previousWeekStart;
                    const wasPreviousWeekSkipped = !sortedLogs.some(sl => isWithinInterval(new Date(sl.date), {start: previousWeekStart, end: endOfWeek(previousWeekStart, {weekStartsOn: 1})}));
                    if (isLogForEarlierWeek && wasPreviousWeekSkipped) break;
                 }
            }
        }
    }
  }
  return streak;
}

export function calculateLongestStreak(habit: Habit, logs: HabitLog[]): number {
    if (!logs || logs.length === 0) return 0;

    const sortedLogs = logs
        .filter(log => log.habitId === habit.id)
        .map(log => new Date(log.date))
        .sort((a, b) => a.getTime() - b.getTime());
    
    if (sortedLogs.length === 0) return 0;

    let longestStreak = 0;
    let currentStreak = 0;

    if (habit.frequency === "daily") {
        if (sortedLogs.length > 0) {
            currentStreak = 1;
            longestStreak = 1;
        }
        for (let i = 1; i < sortedLogs.length; i++) {
            if (differenceInCalendarDays(sortedLogs[i], sortedLogs[i-1]) === 1) {
                currentStreak++;
            } else {
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 1; // Reset for the new day
            }
        }
        longestStreak = Math.max(longestStreak, currentStreak);

    } else if (habit.frequency === "weekly") {
        if (sortedLogs.length > 0) {
            currentStreak = 1;
            longestStreak = 1;
        }
        let lastCompletionWeekStart = startOfWeek(sortedLogs[0], { weekStartsOn: 1 });

        for (let i = 1; i < sortedLogs.length; i++) {
            const currentLogDate = sortedLogs[i];
            const currentLogWeekStart = startOfWeek(currentLogDate, { weekStartsOn: 1 });
            
            // If it's in the same week as the last completion, skip (counts as one completion for that week)
            if (currentLogWeekStart.getTime() === lastCompletionWeekStart.getTime()) {
                continue;
            }

            // If it's the subsequent week
            const expectedNextWeekStart = startOfWeek(subDays(currentLogWeekStart, 7), { weekStartsOn: 1 });
            if (lastCompletionWeekStart.getTime() === expectedNextWeekStart.getTime()) {
                 currentStreak++;
            } else {
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 1; // Reset for this new week's completion
            }
            lastCompletionWeekStart = currentLogWeekStart;
        }
        longestStreak = Math.max(longestStreak, currentStreak);
    }
    return longestStreak;
}

export function getOverallStats(habits: Habit[], logs: HabitLog[]) {
  const totalHabits = habits.length;
  const totalCompletions = logs.length;
  
  let currentOverallStreak = 0;
  let longestOverallStreak = 0;
  let totalPoints = calculatePoints(logs, habits);

  if (totalHabits > 0) {
    // For overall streaks, we might consider the "most consistent" habit or an average.
    // This is simplified: takes the max streak among daily habits.
    // A more complex definition would be needed for a true "overall" daily streak.
    habits.forEach(habit => {
      if (habit.frequency === 'daily') { // Prioritize daily for overall streak display
        currentOverallStreak = Math.max(currentOverallStreak, calculateCurrentStreak(habit, logs));
        longestOverallStreak = Math.max(longestOverallStreak, calculateLongestStreak(habit, logs));
      }
    });
     // If no daily habits, check weekly
    if (currentOverallStreak === 0 && longestOverallStreak === 0) {
        habits.forEach(habit => {
            if (habit.frequency === 'weekly') {
                currentOverallStreak = Math.max(currentOverallStreak, calculateCurrentStreak(habit, logs));
                longestOverallStreak = Math.max(longestOverallStreak, calculateLongestStreak(habit, logs));
            }
        });
    }
  }

  // Success Rate: (Total Completions) / (Total Possible Completions Since Habit Creation)
  // This is a complex calculation. For simplicity, we can show completions / (habits * days_active_period)
  // Or, just show total completions for now.
  // Let's calculate success rate for the last 30 days for daily habits.
  const thirtyDaysAgo = subDays(new Date(), 30);
  let possibleCompletionsLast30Days = 0;
  let actualCompletionsLast30Days = 0;

  habits.forEach(habit => {
    if (habit.frequency === 'daily') {
      const habitStartDate = new Date(habit.createdAt);
      const startDateInPeriod = habitStartDate > thirtyDaysAgo ? habitStartDate : thirtyDaysAgo;
      const daysActiveInPeriod = differenceInCalendarDays(new Date(), startDateInPeriod) + 1;
      if (daysActiveInPeriod > 0) {
        possibleCompletionsLast30Days += daysActiveInPeriod;
        logs.filter(log => log.habitId === habit.id && new Date(log.date) >= startDateInPeriod)
            .forEach(() => actualCompletionsLast30Days++);
      }
    }
  });
  
  const successRate = possibleCompletionsLast30Days > 0 
    ? (actualCompletionsLast30Days / possibleCompletionsLast30Days) * 100 
    : 0;


  return {
    totalHabits,
    totalCompletions,
    totalPoints,
    currentOverallStreak, // This is max current streak of any daily habit
    longestOverallStreak, // This is max longest streak of any daily habit
    successRate: parseFloat(successRate.toFixed(1)) // Percentage
  };
}

export function getPieChartData(habits: Habit[], logs: HabitLog[], days: number = 7) {
  // Pie chart for completed vs. missed daily habits in the last 'days'
  const endDate = new Date();
  const startDate = subDays(endDate, days - 1);
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  let completedCount = 0;
  let missedCount = 0;

  const dailyHabits = habits.filter(h => h.frequency === 'daily');
  
  if (dailyHabits.length === 0) {
    return [{ name: "No Daily Habits", value: 1, fill: "hsl(var(--muted))" }];
  }

  dateRange.forEach(date => {
    const dateString = format(date, "yyyy-MM-dd");
    dailyHabits.forEach(habit => {
      // Habit must exist on this day
      if (new Date(habit.createdAt) <= date) {
        const isCompleted = logs.some(log => log.habitId === habit.id && log.date === dateString);
        if (isCompleted) {
          completedCount++;
        } else {
          missedCount++;
        }
      }
    });
  });
  
  if (completedCount === 0 && missedCount === 0) {
     return [{ name: "No Activity", value: 1, fill: "hsl(var(--muted))" }];
  }

  return [
    { name: "Completed", value: completedCount, fill: "hsl(var(--success))" },
    { name: "Missed", value: missedCount, fill: "hsl(var(--destructive))" },
  ];
}
