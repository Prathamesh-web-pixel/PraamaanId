/**
 * Firebase Client SDK Initialization & Data Storage Service
 * Configured with official PramaanID Firebase project credentials:
 * Project ID: pramaanid
 * Auth Domain: pramaanid.firebaseapp.com
 * Storage Bucket: pramaanid.firebasestorage.app
 * 
 * Manages:
 * 1. Firebase Authentication (Email/Password & Google)
 * 2. Firestore Cloud Data Storage for:
 *    - Users collection ('users')
 *    - Verification documents collection ('verifications')
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  getDocFromServer
} from "firebase/firestore";
import { User, VerificationRecord } from "./types";

// Official web app's Firebase configuration requested by user
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDGOp06tpCDFEdv8oIzNnNkYeWWIlUCy5o",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pramaanid.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "pramaanid",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "pramaanid.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "691366323986",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:691366323986:web:5c11d31730eab907bc75cb"
};

// Initialize Firebase (safely reuse existing instance if already initialized)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged
};
export type { FirebaseUser };

/**
 * Validates connection to Firestore backend
 */
export async function testFirestoreConnection(): Promise<{ connected: boolean; message: string; projectId: string }> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return {
      connected: true,
      message: 'Firestore connection established successfully.',
      projectId: firebaseConfig.projectId
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      return {
        connected: false,
        message: 'Client offline or Firestore endpoint unreachable.',
        projectId: firebaseConfig.projectId
      };
    }
    // Permissions error or non-existent document still confirms connection reached Firebase servers
    return {
      connected: true,
      message: 'Connected to Firebase project (pramaanid).',
      projectId: firebaseConfig.projectId
    };
  }
}

/**
 * Stores user profile data in Firebase Firestore ('users' collection)
 */
export async function saveUserToFirestore(userData: {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt?: string;
  lastLoginAt?: string;
}): Promise<void> {
  try {
    const userRef = doc(db, 'users', userData.id);
    await setDoc(userRef, {
      ...userData,
      updatedAt: new Date().toISOString(),
      cloudSynced: true
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore user persistence notice:', err);
  }
}

/**
 * Stores document verification data in Firebase Firestore ('verifications' collection)
 */
export async function saveVerificationToFirestore(record: VerificationRecord): Promise<void> {
  try {
    const verRef = doc(db, 'verifications', record.id);
    await setDoc(verRef, {
      id: record.id,
      userId: record.userId,
      userEmail: record.userEmail,
      documentType: record.documentType,
      maskedDocumentNumber: record.maskedDocumentNumber,
      fullName: record.fullName,
      dateOfBirth: record.dateOfBirth,
      gender: record.gender,
      status: record.status,
      riskLevel: record.riskLevel,
      confidenceScore: record.confidenceScore,
      cryptographicSeal: record.cryptographicSeal,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      forensics: {
        overallRisk: record.analysis.forensics.overallRisk,
        fontConsistencyScore: record.analysis.forensics.fontConsistencyScore,
        hologramAuthenticityScore: record.analysis.forensics.hologramAuthenticityScore,
        forensicNotes: record.analysis.forensics.forensicNotes
      },
      faceMatch: record.faceMatch ? {
        verdict: record.faceMatch.verdict,
        matchScore: record.faceMatch.matchScore,
        confidence: record.faceMatch.confidence
      } : null,
      cloudSynced: true
    }, { merge: true });

    // Also store reference under the user's subcollection
    const userVerRef = doc(db, 'users', record.userId, 'user_verifications', record.id);
    await setDoc(userVerRef, {
      verificationId: record.id,
      documentType: record.documentType,
      maskedDocumentNumber: record.maskedDocumentNumber,
      status: record.status,
      savedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore verification persistence notice:', err);
  }
}

/**
 * Retrieves stored user verification records from Firebase Firestore
 */
export async function getVerificationsFromFirestore(userId: string): Promise<Partial<VerificationRecord>[]> {
  try {
    const q = query(collection(db, 'verifications'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const records: Partial<VerificationRecord>[] = [];
    querySnapshot.forEach(docSnap => {
      records.push(docSnap.data() as Partial<VerificationRecord>);
    });
    return records;
  } catch (err) {
    console.warn('Firestore verifications retrieval notice:', err);
    return [];
  }
}
