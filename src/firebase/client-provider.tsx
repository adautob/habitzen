"use client";

import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { useState, useEffect } from "react";

import { initializeFirebase } from "@/firebase";
import { FirebaseProvider } from "@/firebase/provider";
import { UserProvider } from "@/firebase/auth/use-user";

type FirebaseClientProviderProps = {
  children: React.ReactNode;
};

export function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  const [firebase, setFirebase] = useState<{
    app: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
  } | null>(null);

  useEffect(() => {
    const firebaseInstances = initializeFirebase();
    setFirebase(firebaseInstances);
  }, []);

  if (!firebase) {
    return null;
  }

  return (
    <FirebaseProvider
      app={firebase.app}
      auth={firebase.auth}
      firestore={firebase.firestore}
    >
      <UserProvider>{children}</UserProvider>
    </FirebaseProvider>
  );
}
