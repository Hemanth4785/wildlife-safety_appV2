import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Report, View } from '../types';
import { subscribeToAuthChanges, loginWithEmail, signUpWithEmail, logoutUser, getCurrentSavedUser } from '../authService';

interface AppContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  authMode: 'login' | 'signup';
  setAuthMode: (mode: 'login' | 'signup') => void;
  currentView: View;
  setCurrentView: (view: View) => void;
  reports: Report[];
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  addReport: (report: Omit<Report, 'id' | 'timestamp'>) => Promise<void>;
  deleteReport: (reportId: string) => Promise<void>;
  isSyncing: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_MOCK_REPORTS: Report[] = [
  {
    id: 'rep-101',
    wildlifeType: 'Asian Elephant',
    location: 'Ooty-Gudalur Highway km 14',
    description: 'Herd of 3 elephants crossing road near stream bridge. Traffic temporarily stopped.',
    timestamp: 'Today, 10 mins ago',
    created_at: '2026-08-07T02:50:00.000Z',
    lat: 11.412,
    lon: 76.698,
    userEmail: 'ranger.kumar@forest.gov.in',
    ai: {
      common: 'Asian Elephant',
      scientific: 'Elephas maximus',
      risk: 'Low',
      summary: 'Keep 100m distance and remain inside vehicle.'
    }
  }
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentSavedUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getCurrentSavedUser());
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [reports, setReports] = useState<Report[]>(DEFAULT_MOCK_REPORTS);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const deletedIdsRef = React.useRef<Set<string | number>>(new Set());

  // 1. Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore Sync for Wildlife Reports
  useEffect(() => {
    setIsSyncing(true);
    let unsubscribe: (() => void) | undefined;

    try {
      const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'), limit(20));
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedReports: Report[] = [];
          snapshot.forEach((doc) => {
            if (deletedIdsRef.current.has(doc.id)) return;
            const data = doc.data();
            fetchedReports.push({
              id: doc.id,
              wildlifeType: data.wildlifeType || 'Asian Elephant',
              location: data.location || 'Corridor Area',
              description: data.description || '',
              timestamp: data.timestamp ? new Date(data.timestamp.toDate?.() || data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
              userEmail: data.userEmail || 'ranger@wildlife.gov.in',
              imageUri: data.imageUri,
              ai: data.ai
            });
          });
          setReports((prev) => {
            const currentNonDeletedLocal = prev.filter((r) => !deletedIdsRef.current.has(r.id));
            if (fetchedReports.length > 0) {
              const fetchedIds = new Set(fetchedReports.map((r) => r.id));
              const localNotFetched = currentNonDeletedLocal.filter((r) => !fetchedIds.has(r.id));
              return [...fetchedReports, ...localNotFetched];
            }
            return currentNonDeletedLocal;
          });
          setIsSyncing(false);
        },
        (_error) => {
          setIsSyncing(false);
        }
      );
    } catch (_e) {
      setIsSyncing(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const user = await loginWithEmail(email, pass);
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentView(View.HOME);
  };

  const signup = async (email: string, pass: string, name?: string) => {
    const user = await signUpWithEmail(email, pass, name);
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentView(View.HOME);
  };

  const logout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentView(View.HOME);
  };

  const addReport = async (newReportData: Omit<Report, 'id' | 'timestamp'>) => {
    const timestamp = new Date().toISOString();
    const tempReport: Report = {
      ...newReportData,
      id: `rep-${Date.now()}`,
      timestamp: 'Just now'
    };

    setReports((prev) => [tempReport, ...prev]);

    try {
      await addDoc(collection(db, 'reports'), {
        ...newReportData,
        timestamp
      });
    } catch (_e) {
      // Local report saved cleanly in state even if Firestore offline
    }
  };

  const deleteReport = async (reportId: string) => {
    // Track deleted ID so snapshots don't re-add it
    deletedIdsRef.current.add(reportId);
    // Immediately remove from local state
    setReports((prev) => prev.filter((rep) => rep.id !== reportId));

    try {
      // Delete document from Firestore collection
      await deleteDoc(doc(db, 'reports', reportId));
    } catch (_e) {
      // Ignore errors if offline or document doesn't exist
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        authMode,
        setAuthMode,
        currentView,
        setCurrentView,
        reports,
        login,
        signup,
        logout,
        addReport,
        deleteReport,
        isSyncing
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
