/**
 * Authentication & Authorization Context
 * Integrates:
 * 1. Mandatory Pre-Login Sign In & Sign Up Gate.
 * 2. Firebase SDK Cloud User & Verification Data Storage (pramaanid).
 * 3. Server-side Bcrypt/HttpOnly session enclave.
 * 4. Instant persona switcher for authorized evaluation.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, VerificationRecord } from '../types';
import { api, setClientToken } from '../services/api';
import {
  auth,
  googleProvider,
  testFirestoreConnection,
  firebaseConfig,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
  FirebaseUser,
  saveUserToFirestore,
  saveVerificationToFirestore
} from '../firebase';

interface FirebaseStatus {
  connected: boolean;
  projectId: string;
  authDomain: string;
  appId: string;
  storageBucket: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  firebaseStatus: FirebaseStatus;
  login: (email: string, pass: string) => Promise<void>;
  loginWithFirebase: (email: string, pass: string) => Promise<void>;
  registerWithFirebase: (email: string, pass: string, name: string) => Promise<void>;
  loginWithGoogleFirebase: () => Promise<void>;
  register: (email: string, name: string, pass: string) => Promise<string>;
  logout: () => Promise<void>;
  switchPersona: (role: UserRole) => Promise<void>;
  saveVerificationData: (record: VerificationRecord) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const PRESET_ACCOUNTS: Record<UserRole, { email: string; pass: string; title: string; desc: string }> = {
  CITIZEN: {
    email: 'citizen@pramaan.gov.in',
    pass: 'Sovereign#2026',
    title: 'Citizen Applicant',
    desc: 'Submit identity proofs, mask PII, perform selfie liveness, view verification receipts.'
  },
  VERIFIER: {
    email: 'verifier@pramaan.gov.in',
    pass: 'Sovereign#2026',
    title: 'Identity Verifier',
    desc: 'Examine suspicious documents, check OCR extractions, and inspect digital signatures.'
  },
  OFFICER: {
    email: 'officer@pramaan.gov.in',
    pass: 'Sovereign#2026',
    title: 'Senior Gazetted Officer',
    desc: 'Approve certificates, override biometric flags, and order field verification.'
  },
  ADMIN: {
    email: 'admin@pramaan.gov.in',
    pass: 'Sovereign#2026',
    title: 'System Administrator',
    desc: 'Manage portal users, configure retention policies, and monitor system security.'
  },
  SUPER_ADMIN: {
    email: 'superadmin@pramaan.gov.in',
    pass: 'Sovereign#2026',
    title: 'Chief Security Officer',
    desc: 'Highest privileges: assign RBAC tiers, rotate keys, and trigger retention purges.'
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [firebaseStatus, setFirebaseStatus] = useState<FirebaseStatus>({
    connected: true,
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    appId: firebaseConfig.appId,
    storageBucket: firebaseConfig.storageBucket
  });

  // Initialize session and Firebase listeners on mount
  useEffect(() => {
    let mounted = true;

    // Test Firestore connectivity
    testFirestoreConnection().then(res => {
      if (mounted) {
        setFirebaseStatus(prev => ({ ...prev, connected: res.connected }));
      }
    }).catch(() => {
      if (mounted) {
        setFirebaseStatus(prev => ({ ...prev, connected: false }));
      }
    });

    // Check existing server session
    async function checkSession() {
      try {
        const res = await api.getMe();
        if (mounted && res.authenticated && res.user) {
          setUser(res.user);
          // Sync with Firestore
          await saveUserToFirestore(res.user);
        }
      } catch {
        // Not logged in; remain unauthenticated so user is prompted to sign in / sign up first
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    // Listen to Firebase Auth state
    const unsubscribeFirebase = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser && mounted) {
        const safeUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || 'firebase.citizen@pramaanid.app',
          fullName: firebaseUser.displayName || 'Verified Citizen',
          role: 'CITIZEN'
        };
        setUser(safeUser);
        await saveUserToFirestore(safeUser);
      }
    });

    checkSession();

    return () => {
      mounted = false;
      unsubscribeFirebase();
    };
  }, []);

  // Standard server-side login
  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setUser(res.user);
    // Persist user data to Firebase Firestore
    await saveUserToFirestore(res.user);
  };

  // Firebase Email/Password Sign-In
  const loginWithFirebase = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const fbUser = userCredential.user;
      const safeUser: User = {
        id: fbUser.uid,
        email: fbUser.email || email,
        fullName: fbUser.displayName || email.split('@')[0],
        role: 'CITIZEN'
      };
      setUser(safeUser);
      await saveUserToFirestore(safeUser);
    } catch (err: unknown) {
      console.warn('Firebase login attempt:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase Email/Password Registration
  const registerWithFirebase = async (email: string, pass: string, name: string) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const fbUser = userCredential.user;
      const safeUser: User = {
        id: fbUser.uid,
        email: fbUser.email || email,
        fullName: name || fbUser.displayName || email.split('@')[0],
        role: 'CITIZEN'
      };
      setUser(safeUser);
      await saveUserToFirestore(safeUser);
    } catch (err: unknown) {
      console.warn('Firebase registration attempt:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase Google Popup Sign-In
  const loginWithGoogleFirebase = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const safeUser: User = {
        id: fbUser.uid,
        email: fbUser.email || 'google.citizen@pramaanid.firebaseapp.com',
        fullName: fbUser.displayName || 'Google Citizen Applicant',
        role: 'CITIZEN'
      };
      setUser(safeUser);
      await saveUserToFirestore(safeUser);
    } catch (err: unknown) {
      console.warn('Firebase popup sign-in encountered an issue or was closed by user:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Citizen Registration on backend and Firebase Firestore
  const register = async (email: string, name: string, pass: string) => {
    const res = await api.register(email, name, pass);
    if (res.user) {
      await saveUserToFirestore({
        id: res.user.id,
        email: res.user.email,
        fullName: res.user.fullName,
        role: res.user.role,
        createdAt: new Date().toISOString()
      });
    }
    return res.message;
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth).catch(() => {});
    } catch {
      // ignore
    }
    await api.logout().catch(() => {});
    setUser(null);
    setClientToken(null);
  };

  const switchPersona = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const preset = PRESET_ACCOUNTS[role];
      const res = await api.login(preset.email, preset.pass);
      setUser(res.user);
      await saveUserToFirestore(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  // Store user's verification data in Firestore & server
  const saveVerificationData = async (record: VerificationRecord) => {
    await saveVerificationToFirestore(record);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        firebaseStatus,
        login,
        loginWithFirebase,
        registerWithFirebase,
        loginWithGoogleFirebase,
        register,
        logout,
        switchPersona,
        saveVerificationData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
