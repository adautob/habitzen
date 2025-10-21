import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { firebaseConfig } from "@/firebase/config";

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

function initializeFirebase() {
  const apps = getApps();
  if (apps.length) {
    app = apps[0];
  } else {
    if (!firebaseConfig) {
      throw new Error(
        "Firebase config is not set. Please update firebase/config.ts"
      );
    }
    app = initializeApp(firebaseConfig);
  }

  auth = getAuth(app);
  firestore = getFirestore(app);

  return { app, auth, firestore };
}

export { initializeFirebase };
export * from "./provider";
export * from "./auth/use-user";
