
"use client";
import type { Habit, HabitLog, ExportData } from "@/types";
import { DB_NAME, DB_VERSION, HABITS_STORE_NAME, HABIT_LOGS_STORE_NAME } from "./constants";
import { generateUUID } from "@/lib/uuid"; // Importar o gerador de UUID

let dbPromise: Promise<IDBDatabase> | null = null;

const initDB = (): Promise<IDBDatabase> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error("IndexedDB cannot be used in SSR."));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(HABITS_STORE_NAME)) {
        db.createObjectStore(HABITS_STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(HABIT_LOGS_STORE_NAME)) {
        const habitLogsStore = db.createObjectStore(HABIT_LOGS_STORE_NAME, { keyPath: "id" });
        habitLogsStore.createIndex("habitId", "habitId", { unique: false });
        habitLogsStore.createIndex("date", "date", { unique: false });
        habitLogsStore.createIndex("habitId_date", ["habitId", "date"], { unique: true });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
  return dbPromise;
};

export const addHabit = async (habit: Habit): Promise<string> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HABITS_STORE_NAME, "readwrite");
    const store = transaction.objectStore(HABITS_STORE_NAME);
    const request = store.add(habit);
    request.onsuccess = () => resolve(request.result as string);
    request.onerror = () => reject(request.error);
  });
};

export const getHabits = async (): Promise<Habit[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HABITS_STORE_NAME, "readonly");
    const store = transaction.objectStore(HABITS_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as Habit[]);
    request.onerror = () => reject(request.error);
  });
};

export const updateHabit = async (habit: Habit): Promise<string> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HABITS_STORE_NAME, "readwrite");
    const store = transaction.objectStore(HABITS_STORE_NAME);
    const request = store.put(habit);
    request.onsuccess = () => resolve(request.result as string);
    request.onerror = () => reject(request.error);
  });
};

export const deleteHabit = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise(async (resolve, reject) => {
    // Also delete associated logs
    const logs = await getHabitLogs(id);
    const logDeletionPromises = logs.map(log => deleteHabitLog(log.id));
    await Promise.all(logDeletionPromises).catch(reject);

    const transaction = db.transaction(HABITS_STORE_NAME, "readwrite");
    const store = transaction.objectStore(HABITS_STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const logHabitCompletion = async (habitId: string, date: string, notes?: string): Promise<HabitLog> => {
  const db = await initDB();
  const newLog: HabitLog = {
    id: generateUUID(),
    habitId,
    date,
    completedAt: Date.now(),
    ...(notes && { notes }), // Add notes if provided
  };
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HABIT_LOGS_STORE_NAME, "readwrite");
    const store = transaction.objectStore(HABIT_LOGS_STORE_NAME);
    const request = store.add(newLog);
    request.onsuccess = () => resolve(newLog);
    request.onerror = (event) => {
      if (request.error?.name === 'ConstraintError') {
        console.warn(`Hábito ${habitId} já registrado para a data ${date}.`);
        getHabitLogByHabitIdAndDate(habitId, date).then(existingLog => {
          if (existingLog) { // If it already exists, and we are trying to add notes, update it (or decide on behavior)
            // For now, let's assume if it's a constraint error, we don't overwrite notes.
            // A more complex logic might update notes if provided.
            resolve(existingLog);
          } else {
            reject(request.error);
          }
        }).catch(reject);
      } else {
        reject(request.error);
      }
    };
  });
};

export const getHabitLogByHabitIdAndDate = async (habitId: string, date: string): Promise<HabitLog | undefined> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HABIT_LOGS_STORE_NAME, "readonly");
    const store = transaction.objectStore(HABIT_LOGS_STORE_NAME);
    const index = store.index("habitId_date");
    const request = index.get([habitId, date]);
    request.onsuccess = () => resolve(request.result as HabitLog | undefined);
    request.onerror = () => reject(request.error);
  });
};


export const getHabitLogs = async (habitId?: string): Promise<HabitLog[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HABIT_LOGS_STORE_NAME, "readonly");
    const store = transaction.objectStore(HABIT_LOGS_STORE_NAME);
    let request: IDBRequest<any[]>;
    if (habitId) {
      const index = store.index("habitId");
      request = index.getAll(habitId);
    } else {
      request = store.getAll();
    }
    request.onsuccess = () => resolve(request.result as HabitLog[]);
    request.onerror = () => reject(request.error);
  });
};

export const deleteHabitLog = async (logId: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HABIT_LOGS_STORE_NAME, "readwrite");
    const store = transaction.objectStore(HABIT_LOGS_STORE_NAME);
    const request = store.delete(logId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};


export const exportData = async (): Promise<void> => {
  try {
    const habits = await getHabits();
    const habitLogs = await getHabitLogs();
    const data: ExportData = { habits, habitLogs };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `habitzen_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting data:", error);
    throw error;
  }
};

