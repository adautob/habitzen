
"use client";
import type { Habit, HabitLog, HabitFormData } from "@/types";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  Timestamp,
  getDoc,
  Firestore,
} from "firebase/firestore";
import { initializeFirebase } from "@/firebase";
import { POINTS_PER_DIFFICULTY } from "./constants";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

// Helper para obter o firestore db
const getDb = () => {
    const { firestore } = initializeFirebase();
    return firestore;
}

// *** Funções de Hábitos (Habits) ***

export const addHabit = (userId: string, habitData: HabitFormData): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    if (!userId) {
      const err = new Error("Usuário não autenticado.");
      reject(err);
      return;
    }
    const db = getDb();
    
    const habitCollectionRef = collection(db, "users", userId, "habits");

    const newHabitData: Omit<Habit, "id" | "createdAt"> & { createdAt: number } = {
        name: habitData.name,
        category: habitData.category,
        difficulty: habitData.difficulty,
        frequency: habitData.frequency,
        createdAt: Date.now(),
        points: POINTS_PER_DIFFICULTY[habitData.difficulty],
        ...(habitData.color && { color: habitData.color }),
    };

    addDoc(habitCollectionRef, newHabitData)
      .then(docRef => {
        resolve(docRef.id);
      })
      .catch(serverError => {
        const permissionError = new FirestorePermissionError({
          path: habitCollectionRef.path,
          operation: 'create',
          requestResourceData: newHabitData,
        });
        errorEmitter.emit('permission-error', permissionError);
        reject(permissionError);
      });
  });
};


export const getHabits = async (userId: string): Promise<Habit[]> => {
  if (!userId) return [];
  const db = getDb();
  const habitCollectionRef = collection(db, "users", userId, "habits");
  try {
    const snapshot = await getDocs(habitCollectionRef);
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Habit));
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: habitCollectionRef.path,
      operation: 'list',
    });
    errorEmitter.emit('permission-error', permissionError);
    // Return empty array on error to prevent app crash
    return [];
  }
};

export const updateHabit = (userId: string, habit: Habit): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!userId) return reject(new Error("Usuário não autenticado."));
        if (!habit.id) return reject(new Error("ID do hábito é necessário para atualização."));
        const db = getDb();

        const habitDocRef = doc(db, "users", userId, "habits", habit.id);
        const { id, ...habitData } = habit; 
        
        updateDoc(habitDocRef, habitData)
            .then(resolve)
            .catch(serverError => {
                const permissionError = new FirestorePermissionError({
                    path: habitDocRef.path,
                    operation: 'update',
                    requestResourceData: habitData,
                });
                errorEmitter.emit('permission-error', permissionError);
                reject(permissionError);
            });
    });
};


export const deleteHabit = (userId: string, habitId: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        if (!userId) return reject(new Error("Usuário não autenticado."));
        const db = getDb();
        const batch = writeBatch(db);
        const habitDocRef = doc(db, "users", userId, "habits", habitId);
        batch.delete(habitDocRef);

        const logsCollectionRef = collection(db, "users", userId, "habitLogs");
        const logsQuery = query(logsCollectionRef, where("habitId", "==", habitId));
        
        try {
            const logsSnapshot = await getDocs(logsQuery);
            logsSnapshot.forEach(logDoc => {
                batch.delete(logDoc.ref);
            });
            
            await batch.commit();
            resolve();
        } catch (serverError: any) {
            // Check if it's a permission error during the query or the commit
            const failedPath = serverError.path || logsQuery.toString();
            const permissionError = new FirestorePermissionError({
                path: failedPath,
                operation: 'delete', // A bit generic, but it's a batch
            });
            errorEmitter.emit('permission-error', permissionError);
            reject(permissionError);
        }
    });
};

// *** Funções de Logs de Hábitos (HabitLogs) ***

export const logHabitCompletion = (userId: string, habitId: string, date: string, notes?: string): Promise<HabitLog> => {
    return new Promise((resolve, reject) => {
        if (!userId) return reject(new Error("Usuário não autenticado."));
        const db = getDb();

        const newLogData = {
            habitId,
            date,
            completedAt: Timestamp.now().toMillis(),
            ...(notes && { notes }),
        };
        
        const logsCollectionRef = collection(db, "users", userId, "habitLogs");
        addDoc(logsCollectionRef, newLogData)
            .then(docRef => {
                resolve({ id: docRef.id, ...newLogData });
            })
            .catch(serverError => {
                const permissionError = new FirestorePermissionError({
                    path: logsCollectionRef.path,
                    operation: 'create',
                    requestResourceData: newLogData,
                });
                errorEmitter.emit('permission-error', permissionError);
                reject(permissionError);
            });
    });
};


export const getHabitLogByHabitIdAndDate = async (userId: string, habitId: string, date: string): Promise<HabitLog | undefined> => {
  if (!userId) return undefined;
  const db = getDb();
  
  const logsCollectionRef = collection(db, "users", userId, "habitLogs");
  const q = query(logsCollectionRef, where("habitId", "==", habitId), where("date", "==", date));
  
  try {
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return undefined;
    }
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as HabitLog;
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
        path: logsCollectionRef.path, // or q.toString() for more detail
        operation: 'list',
    });
    errorEmitter.emit('permission-error', permissionError);
    return undefined;
  }
};


export const getHabitLogs = async (userId: string, habitId?: string): Promise<HabitLog[]> => {
    if (!userId) return [];
    const db = getDb();
    
    const logsCollectionRef = collection(db, "users", userId, "habitLogs");
    
    let q;
    if (habitId) {
        q = query(logsCollectionRef, where("habitId", "==", habitId));
    } else {
        q = query(logsCollectionRef);
    }

    try {
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
          return [];
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as HabitLog);
    } catch (serverError) {
       const permissionError = new FirestorePermissionError({
            path: logsCollectionRef.path,
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        return [];
    }
};

export const updateHabitLog = (userId: string, log: HabitLog): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!userId) return reject(new Error("Usuário não autenticado."));
        if (!log.id) return reject(new Error("ID do log é necessário para atualização."));
        const db = getDb();

        const logDocRef = doc(db, "users", userId, "habitLogs", log.id);
        const { id, ...logData } = log;
        updateDoc(logDocRef, logData)
            .then(resolve)
            .catch(serverError => {
                const permissionError = new FirestorePermissionError({
                    path: logDocRef.path,
                    operation: 'update',
                    requestResourceData: logData
                });
                errorEmitter.emit('permission-error', permissionError);
                reject(permissionError);
            });
    });
};

export const deleteHabitLog = (userId: string, logId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!userId) return reject(new Error("Usuário não autenticado."));
    const db = getDb();
    const logDocRef = doc(db, "users", userId, "habitLogs", logId);
    deleteDoc(logDocRef)
      .then(resolve)
      .catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: logDocRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        reject(permissionError);
      });
  });
};
