
import type { Habit, HabitLog, Medal, MedalDefinition } from "@/types";
import { differenceInCalendarDays, eachDayOfInterval, format, subDays, startOfWeek, endOfWeek, isWithinInterval, parseISO, getWeek, getMonth, getYear, subWeeks, subMonths, endOfDay, startOfDay, eachWeekOfInterval,getDay } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { MEDAL_DEFINITIONS } from "./medalsData";

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
    .map(log => ({ ...log, dateObj: parseISO(log.date) })) //YYYY-MM-DD
    .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

  if (sortedLogs.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0,0,0,0);


  if (habit.frequency === "daily") {
    const lastLogDate = sortedLogs[0].dateObj;
    if (differenceInCalendarDays(currentDate, lastLogDate) > 1) {
      return 0;
    }
    if (differenceInCalendarDays(currentDate, lastLogDate) <= 1) {
      streak = 1;
      let expectedDate = subDays(lastLogDate, 1);
      for (let i = 1; i < sortedLogs.length; i++) {
        if (differenceInCalendarDays(expectedDate, sortedLogs[i].dateObj) === 0) {
          streak++;
          expectedDate = subDays(sortedLogs[i].dateObj, 1);
        } else if (differenceInCalendarDays(expectedDate, sortedLogs[i].dateObj) > 0 ) { 
          // Gap in logs, streak broken
          break;
        }
        // If sortedLogs[i].date is same as expectedDate, continue. If older, break.
      }
    }
  } else if (habit.frequency === "weekly") {
    // For weekly, check if completed in the current week, then previous week, etc.
    let currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    
    const completedThisWeek = sortedLogs.some(log => 
        isWithinInterval(log.dateObj, { start: currentWeekStart, end: endOfWeek(currentDate, { weekStartsOn: 1 }) })
    );

    if (completedThisWeek) {
        streak = 1;
        let expectedPreviousWeekStart = startOfWeek(subDays(currentWeekStart, 7), { weekStartsOn: 1 });
        
        // Use a set to track weeks already counted to avoid double counting for multiple completions in a week
        const countedWeeks = new Set<string>();
        countedWeeks.add(`${getYear(currentWeekStart)}-${getWeek(currentWeekStart)}`);

        for (const log of sortedLogs) {
            const logWeekStart = startOfWeek(log.dateObj, { weekStartsOn: 1 });
            const logWeekKey = `${getYear(logWeekStart)}-${getWeek(logWeekStart)}`;

            if (logWeekStart.getTime() === expectedPreviousWeekStart.getTime() && !countedWeeks.has(logWeekKey)) {
                streak++;
                countedWeeks.add(logWeekKey);
                expectedPreviousWeekStart = startOfWeek(subDays(expectedPreviousWeekStart, 7), { weekStartsOn: 1 });
            } else if (logWeekStart < expectedPreviousWeekStart && !countedWeeks.has(logWeekKey)) {
                // Streak broken if we skip a week
                break;
            }
        }
    }
  }
  return streak;
}

export function calculateLongestStreak(habit: Habit, logs: HabitLog[]): number {
    if (!logs || logs.length === 0) return 0;

    const sortedLogDates = logs
        .filter(log => log.habitId === habit.id)
        .map(log => parseISO(log.date)) // YYYY-MM-DD
        .sort((a, b) => a.getTime() - b.getTime());
    
    if (sortedLogDates.length === 0) return 0;

    let longestStreak = 0;
    let currentStreak = 0;

    if (habit.frequency === "daily") {
        if (sortedLogDates.length > 0) {
            currentStreak = 1;
            longestStreak = 1;
        }
        for (let i = 1; i < sortedLogDates.length; i++) {
            if (differenceInCalendarDays(sortedLogDates[i], sortedLogDates[i-1]) === 1) {
                currentStreak++;
            } else if (differenceInCalendarDays(sortedLogDates[i], sortedLogDates[i-1]) > 1) {
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 1; // Reset for the new day if there's a gap
            }
            // If same day, currentStreak doesn't change, longestStreak is updated at end or gap
        }
        longestStreak = Math.max(longestStreak, currentStreak);

    } else if (habit.frequency === "weekly") {
        if (sortedLogDates.length === 0) return 0;
        
        const uniqueWeeksCompleted = Array.from(new Set(
          sortedLogDates.map(date => `${getYear(date)}-${getWeek(date, { weekStartsOn: 1 })}`)
        )).map(weekStr => {
          const [year, weekNum] = weekStr.split('-').map(Number);
          return { year, weekNum, sortKey: year * 100 + weekNum };
        }).sort((a,b) => a.sortKey - b.sortKey);


        if (uniqueWeeksCompleted.length > 0) {
            currentStreak = 1;
            longestStreak = 1;
        } else {
            return 0;
        }

        for (let i = 1; i < uniqueWeeksCompleted.length; i++) {
            const prevWeek = uniqueWeeksCompleted[i-1];
            const currentWeek = uniqueWeeksCompleted[i];
            
            let expectedYear = prevWeek.year;
            let expectedWeekNum = prevWeek.weekNum + 1;
            
            // Handle year transition for week numbers
            const dateInPrevWeek = startOfWeek(new Date(prevWeek.year, 0, (prevWeek.weekNum - 1) * 7 + 1), {weekStartsOn:1});
            const dateInExpectedWeek = startOfWeek(subWeeks(dateInPrevWeek, -1),{weekStartsOn:1});

            expectedYear = getYear(dateInExpectedWeek);
            expectedWeekNum = getWeek(dateInExpectedWeek, { weekStartsOn: 1 });


            if (currentWeek.year === expectedYear && currentWeek.weekNum === expectedWeekNum) {
                 currentStreak++;
            } else {
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 1; // Reset for this new week's completion
            }
        }
        longestStreak = Math.max(longestStreak, currentStreak);
    }
    return longestStreak;
}


const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500]; // Points to reach level (index + 1)

export function calculateUserLevelAndPointsToNext(totalPoints: number): {
  level: number;
  pointsToNextLevel: number;
  currentLevelProgress: number;
  currentLevelMinPoints: number;
  nextLevelMinPoints: number;
} {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalPoints >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }

  const currentLevelMinPoints = LEVEL_THRESHOLDS[level - 1];
  const nextLevelMinPoints = LEVEL_THRESHOLDS[level] ?? Infinity; // Points needed for next level
  
  let pointsToNextLevel: number;
  let currentLevelProgress: number;

  if (nextLevelMinPoints === Infinity) { // Max level
    pointsToNextLevel = 0;
    currentLevelProgress = 100;
  } else {
    pointsToNextLevel = nextLevelMinPoints - totalPoints;
    const pointsInCurrentLevel = nextLevelMinPoints - currentLevelMinPoints;
    currentLevelProgress = pointsInCurrentLevel > 0 ? ((totalPoints - currentLevelMinPoints) / pointsInCurrentLevel) * 100 : 100;
  }

  return {
    level,
    pointsToNextLevel: Math.max(0, pointsToNextLevel),
    currentLevelProgress: parseFloat(Math.min(100, currentLevelProgress).toFixed(1)),
    currentLevelMinPoints,
    nextLevelMinPoints
  };
}


export function getOverallStats(habits: Habit[], logs: HabitLog[]) {
  const totalHabits = habits.length;
  const totalCompletions = logs.length;
  const totalPoints = calculatePoints(logs, habits);
  const { level, pointsToNextLevel, currentLevelProgress } = calculateUserLevelAndPointsToNext(totalPoints);

  let currentOverallStreak = 0;
  let longestOverallStreak = 0;

  if (totalHabits > 0) {
    habits.forEach(habit => {
       currentOverallStreak = Math.max(currentOverallStreak, calculateCurrentStreak(habit, logs));
       longestOverallStreak = Math.max(longestOverallStreak, calculateLongestStreak(habit, logs));
    });
  }

  const thirtyDaysAgo = subDays(new Date(), 29); // include today
  thirtyDaysAgo.setHours(0,0,0,0);
  let possibleCompletionsLast30Days = 0;
  let actualCompletionsLast30Days = 0;

  habits.forEach(habit => {
    if (habit.frequency === 'daily') {
      const habitStartDate = new Date(habit.createdAt);
      habitStartDate.setHours(0,0,0,0);
      
      const range = eachDayOfInterval({
        start: thirtyDaysAgo > habitStartDate ? thirtyDaysAgo : habitStartDate,
        end: new Date()
      });

      range.forEach(day => {
        if (day <= new Date()) { // Only count for past or current days
             possibleCompletionsLast30Days++;
             if (logs.some(log => log.habitId === habit.id && format(parseISO(log.date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))) {
                 actualCompletionsLast30Days++;
             }
        }
      });
    }
  });
  
  const successRate = possibleCompletionsLast30Days > 0 
    ? (actualCompletionsLast30Days / possibleCompletionsLast30Days) * 100 
    : 0;

  return {
    totalHabits,
    totalCompletions,
    totalPoints,
    currentOverallStreak,
    longestOverallStreak,
    successRate: parseFloat(successRate.toFixed(1)),
    userLevel: level,
    pointsToNextLevel,
    currentLevelProgress,
  };
}

export function getPieChartData(habits: Habit[], logs: HabitLog[], days: number = 7) {
  const endDate = new Date();
  endDate.setHours(0,0,0,0);
  const startDate = subDays(endDate, days - 1);
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  let completedCount = 0;
  let missedCount = 0;

  const dailyHabits = habits.filter(h => h.frequency === 'daily');
  
  if (dailyHabits.length === 0) {
    return [{ name: "Sem Hábitos Diários", value: 1, fill: "hsl(var(--muted))" }];
  }

  dateRange.forEach(date => {
    const dateString = format(date, "yyyy-MM-dd");
    dailyHabits.forEach(habit => {
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
     return [{ name: "Sem Atividade", value: 1, fill: "hsl(var(--muted))" }];
  }

  return [
    { name: "Concluídos", value: completedCount, fill: "hsl(var(--success))" },
    { name: "Perdidos", value: missedCount, fill: "hsl(var(--destructive))" },
  ].filter(item => item.value > 0);
}


export function checkMedalAchievement(medalDefinition: MedalDefinition, habits: Habit[], logs: HabitLog[]): boolean {
  switch (medalDefinition.id) {
    case "beginner_steps": // Criar o primeiro hábito
      return habits.length >= 1;
    case "perfect_week_daily": // Completar qualquer hábito diário por 7 dias seguidos
      return habits.some(h => h.frequency === "daily" && calculateLongestStreak(h, logs) >= 7);
    case "habit_collector_5": // Ter 5 hábitos ativos
      return habits.length >= 5;
    case "point_hoarder_1000": // Acumular 1000 pontos
      return calculatePoints(logs, habits) >= 1000;
    case "streak_master_30": // Manter qualquer hábito com sequência de 30 dias.
      return habits.some(h => calculateLongestStreak(h, logs) >= 30);
    default:
      return false;
  }
}

export function getAchievedMedals(habits: Habit[], logs: HabitLog[]): Medal[] {
  const now = Date.now();
  return MEDAL_DEFINITIONS.map(def => {
    const isAchieved = checkMedalAchievement(def, habits, logs);
    // For now, achievedAt is always "now" if criteria met.
    // A more robust system would store initial achievedAt timestamps in DB or localStorage.
    return {
      ...def,
      achievedAt: isAchieved ? now : null, 
    };
  }).filter(medal => medal.achievedAt !== null);
}


export function getSuccessRateTrend(
  habits: Habit[],
  logs: HabitLog[],
  numPeriods: number = 6, 
  periodType: 'weekly' | 'monthly' = 'weekly'
): { name: string; taxaSucesso: number }[] {
  const trendData: { name: string; taxaSucesso: number }[] = [];
  const today = endOfDay(new Date()); // Use end of today to ensure current week/month calculations are correct

  for (let i = 0; i < numPeriods; i++) {
    let periodStart: Date;
    let periodEnd: Date;
    let periodName: string;

    if (periodType === 'weekly') {
      // Calculate the end of the week `i` weeks ago
      const targetDateForWeekEnd = subWeeks(today, i);
      periodEnd = endOfWeek(targetDateForWeekEnd, { weekStartsOn: 1 });
      // Calculate the start of that same week
      periodStart = startOfWeek(targetDateForWeekEnd, { weekStartsOn: 1 });
      
      periodName = `Semana ${getWeek(periodStart, {weekStartsOn:1, locale: ptBR})}`;
       if (isWithinInterval(today, {start: periodStart, end: periodEnd})) {
         periodName = "Esta Semana";
       } else if (isWithinInterval(subWeeks(today,1), {start: periodStart, end: periodEnd})) {
         periodName = "Semana Passada";
       }

    } else { // monthly
      const targetDateForMonthEnd = subMonths(today, i);
      periodEnd = endOfWeek(targetDateForMonthEnd, { weekStartsOn: 1 }); // This line was incorrect, should be endOfMonth
      periodStart = startOfWeek(targetDateForMonthEnd, { weekStartsOn: 1 }); // This line was incorrect, should be startOfMonth
      periodName = format(periodStart, "MMM yyyy", {locale: ptBR});

      if (getMonth(today) === getMonth(periodStart) && getYear(today) === getYear(periodStart)) {
        periodName = "Este Mês";
      } else if (getMonth(subMonths(today,1)) === getMonth(periodStart) && getYear(subMonths(today,1)) === getYear(periodStart)) {
        periodName = "Mês Passado";
      }
    }
    
    let possibleCompletions = 0;
    let actualCompletions = 0;
    const daysInPeriod = eachDayOfInterval({start: periodStart, end: periodEnd});

    daysInPeriod.forEach(dayInPeriod => {
       // Ensure we don't count future days in the current period
       if (dayInPeriod > today) return;

       habits.forEach(habit => {
          if (habit.frequency === 'daily' && startOfDay(new Date(habit.createdAt)) <= dayInPeriod) {
             possibleCompletions++;
             if (logs.some(log => log.habitId === habit.id && format(parseISO(log.date), "yyyy-MM-dd") === format(dayInPeriod, "yyyy-MM-dd"))) {
                actualCompletions++;
            }
          }
       });
    });

    const successRate = possibleCompletions > 0 ? (actualCompletions / possibleCompletions) * 100 : 0;
    trendData.push({ name: periodName, taxaSucesso: parseFloat(successRate.toFixed(1)) });
  }

  return trendData.reverse(); // Show oldest period first
}

export interface HeatmapCell {
  date: string; // YYYY-MM-DD
  count: number; // Number of completions, 0 or 1 for a daily habit
  level: 0 | 1 | 2 | 3 | 4; // For coloring intensity (0: no data/activity, 1: low, ..., 4: high) - for now, 0 or 1 (completed)
}

export interface HeatmapData {
  weeks: HeatmapCell[][]; // Array of weeks, each week is an array of 7 day cells (or null for padding)
  monthLabels: { month: string; weekIndex: number }[];
}

export function getHabitHeatmapData(
  habitId: string,
  allLogs: HabitLog[],
  numWeeks: number = 16 // Approx 4 months
): HeatmapData {
  const habitLogs = allLogs.filter(log => log.habitId === habitId && log.date);
  const logSet = new Set(habitLogs.map(log => format(parseISO(log.date), "yyyy-MM-dd")));

  const today = endOfDay(new Date());
  const endDate = today;
  const startDate = startOfWeek(subWeeks(today, numWeeks -1 ), { weekStartsOn: 0 }); // Sunday as start of week for typical heatmaps

  const weeks: HeatmapCell[][] = [];
  const monthLabels: { month: string; weekIndex: number }[] = [];
  let currentMonth = -1;

  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  
  let week: HeatmapCell[] = [];

  // Pad the first week if it doesn't start on Sunday
  const firstDayIndex = getDay(startDate); // 0 for Sunday, 1 for Monday ...
  for (let i = 0; i < firstDayIndex; i++) {
    week.push({ date: '', count: 0, level: 0 }); // Placeholder for empty days
  }


  allDays.forEach((day, index) => {
    const dayDate = startOfDay(day);
    const dateString = format(dayDate, "yyyy-MM-dd");
    const dayOfWeek = getDay(dayDate); // 0 for Sunday

    if (dayOfWeek === 0 && week.length > 0 && index > 0) { // Start of a new week (Sunday), and not the very first day
        // Pad the previous week if it's not full (7 days)
        while(week.length < 7) {
            week.push({ date: '', count: 0, level: 0 });
        }
        weeks.push(week);
        week = [];
    }
    
    const month = getMonth(dayDate);
    if (month !== currentMonth) {
      currentMonth = month;
      // Add month label if it's the start of the month or the first week shown
      if (weeks.length === 0 || getDay(dayDate) < 3 || weeks[weeks.length-1].length < 7) { // Heuristic for placing month labels
         monthLabels.push({ month: format(dayDate, "MMM", { locale: ptBR }), weekIndex: weeks.length });
      }
    }

    const completed = logSet.has(dateString);
    week.push({
      date: dateString,
      count: completed ? 1 : 0,
      level: completed ? 1 : 0, // Simple completion status for now
    });
  });

  // Add the last partially filled week
  if (week.length > 0) {
     while(week.length < 7) {
        week.push({ date: '', count: 0, level: 0 }); // Placeholder for empty days
    }
    weeks.push(week);
  }
  
  // Filter monthLabels to avoid too many close labels
  const filteredMonthLabels = monthLabels.reduce((acc, current, idx) => {
    if (idx === 0 || (current.weekIndex > acc[acc.length - 1].weekIndex + 1)) { // Show if first or if there's a gap
      acc.push(current);
    }
    return acc;
  }, [] as { month: string; weekIndex: number }[]);


  return { weeks, monthLabels: filteredMonthLabels };
}
