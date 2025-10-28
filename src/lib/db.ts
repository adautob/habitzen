
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
} from "firebase/firestore";
import { initializeFirebase } from "@/firebase";
import { POINTS_PER_DIFFICULTY } from "./constants";

// Helper para obter o firestore db
const getDb = () => {
    const { firestore } = initializeFirebase();
    return firestore;
}

// *** Funções de Hábitos (Habits) ***

export const addHabit = async (userId: string, habitData: HabitFormData): Promise<string> => {
  if (!userId) throw new Error("Usuário não autenticado.");
  const db = getDb();
  
  const habitCollectionRef = collection(db, "users", userId, "habits");

  const newHabit: Omit<Habit, "id"> = {
    name: habitData.name,
    category: habitData.category,
    difficulty: habitData.difficulty,
    frequency: habitData.frequency,
    createdAt: Date.now(),
    points: POINTS_PER_DIFFICULTY[habitData.difficulty],
    ...(habitData.color && { color: habitData.color }),
  };

  const docRef = await addDoc(habitCollectionRef, newHabit);
  return docRef.id;
};


export const getHabits = async (userId: string): Promise<Habit[]> => {
  if (!userId) return [];
  const db = getDb();
  const habitCollectionRef = collection(db, "users", userId, "habits");
  const snapshot = await getDocs(habitCollectionRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Habit));
};

export const updateHabit = async (userId: string, habit: Habit): Promise<void> => {
  if (!userId) throw new Error("Usuário não autenticado.");
  if (!habit.id) throw new Error("ID do hábito é necessário para atualização.");
  const db = getDb();

  const habitDocRef = doc(db, "users", userId, "habits", habit.id);
  // O ID já está no caminho do documento, então não o incluímos nos dados a serem definidos
  const { id, ...habitData } = habit; 
  
  await updateDoc(habitDocRef, habitData);
};


export const deleteHabit = async (userId: string, habitId: string): Promise<void> => {
  if (!userId) throw new Error("Usuário não autenticado.");
  const db = getDb();

  // Iniciar um batch para excluir o hábito e seus logs atomicamente
  const batch = writeBatch(db);

  // 1. Excluir o documento do hábito
  const habitDocRef = doc(db, "users", userId, "habits", habitId);
  batch.delete(habitDocRef);

  // 2. Encontrar e excluir todos os logs associados
  const logsCollectionRef = collection(db, "users", userId, "habitLogs");
  const logsQuery = query(logsCollectionRef, where("habitId", "==", habitId));
  const logsSnapshot = await getDocs(logsQuery);
  logsSnapshot.forEach(logDoc => {
    batch.delete(logDoc.ref);
  });

  // 3. Executar o batch
  await batch.commit();
};

// *** Funções de Logs de Hábitos (HabitLogs) ***

export const logHabitCompletion = async (userId: string, habitId: string, date: string, notes?: string): Promise<HabitLog> => {
  if (!userId) throw new Error("Usuário não autenticado.");
  const db = getDb();

  const newLogData = {
    habitId,
    date,
    completedAt: Timestamp.now().toMillis(),
    ...(notes && { notes }),
  };
  
  const logsCollectionRef = collection(db, "users", userId, "habitLogs");
  const docRef = await addDoc(logsCollectionRef, newLogData);
  
  return { id: docRef.id, ...newLogData };
};


export const getHabitLogByHabitIdAndDate = async (userId: string, habitId: string, date: string): Promise<HabitLog | undefined> => {
  if (!userId) return undefined;
  const db = getDb();
  
  const logsCollectionRef = collection(db, "users", userId, "habitLogs");
  const q = query(logsCollectionRef, where("habitId", "==", habitId), where("date", "==", date));
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return undefined;
  }
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as HabitLog;
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

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as HabitLog);
};

export const updateHabitLog = async (userId: string, log: HabitLog): Promise<void> => {
    if (!userId) throw new Error("Usuário não autenticado.");
    if (!log.id) throw new Error("ID do log é necessário para atualização.");
    const db = getDb();

    const logDocRef = doc(db, "users", userId, "habitLogs", log.id);
    const { id, ...logData } = log;
    await updateDoc(logDocRef, logData);
};

export const deleteHabitLog = async (userId: string, logId: string): Promise<void> => {
  if (!userId) throw new Error("Usuário não autenticado.");
  const db = getDb();
  const logDocRef = doc(db, "users", userId, "habitLogs", logId);
  await deleteDoc(logDocRef);
};
