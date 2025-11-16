import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC7EKFZpvJtCvH1-aUZJcDB5S6Cq5JuGUs",
  authDomain: "emiratesd-29ff7.firebaseapp.com",
  projectId: "emiratesd-29ff7",
  storageBucket: "emiratesd-29ff7.firebasestorage.app",
  messagingSenderId: "150366590989",
  appId: "1:150366590989:web:3ecdd09e3530402f465d44",
  measurementId: "G-77D9WCBBGE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);

// Initialize Analytics (only in browser)
let analytics: ReturnType<typeof getAnalytics> | undefined;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    // Analytics might fail in some environments
    console.warn("Firebase Analytics initialization failed:", error);
  }
}

export { analytics };
export default app;

