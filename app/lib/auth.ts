import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  photoURL?: string;
  role?: string;
  createdAt?: any;
  updatedAt?: any;
}

export const signIn = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const signUp = async (
  email: string,
  password: string,
  displayName: string,
  role: string = "user"
) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  
  // Update display name
  await updateProfile(userCredential.user, { displayName });

  // Create user document in Firestore
  const userData: UserData = {
    uid: userCredential.user.uid,
    email: userCredential.user.email!,
    displayName,
    role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, "users", userCredential.user.uid), userData);

  return userCredential.user;
};

export const logout = async () => {
  await signOut(auth);
};

export const getUserData = async (uid: string): Promise<UserData | null> => {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists()) {
    return userDoc.data() as UserData;
  }
  return null;
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Create user function for admin use
export const createUser = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  phone: string,
  role: string = "user"
) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  
  const displayName = `${firstName} ${lastName}`;
  
  // Update display name
  await updateProfile(userCredential.user, { displayName });

  // Create user document in Firestore
  const userData: UserData = {
    uid: userCredential.user.uid,
    email: userCredential.user.email!,
    displayName,
    firstName,
    lastName,
    phone,
    role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, "users", userCredential.user.uid), userData);

  return userCredential.user;
};

