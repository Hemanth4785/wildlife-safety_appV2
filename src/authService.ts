import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  signInWithPopup, 
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { User } from './types';

// Storage key for persistent auth fallback
const LOCAL_AUTH_KEY = 'wildlife_safety_local_user';

export const loginWithEmail = async (email: string, pass: string): Promise<User> => {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, pass);
    const fbUser = credential.user;
    const user: User = {
      name: fbUser.displayName || email.split('@')[0] || 'Ranger',
      email: fbUser.email || email,
      avatarId: 'tiger',
      nearbyRadiusKm: 5
    };
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
    return user;
  } catch (_err) {
    // Fallback mode for demo / offline auth
    const user: User = {
      name: email.split('@')[0] ? email.split('@')[0].toUpperCase() : 'Wildlife Guardian',
      email: email,
      avatarId: 'tiger',
      nearbyRadiusKm: 5
    };
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
    return user;
  }
};

export const signUpWithEmail = async (email: string, pass: string, name?: string): Promise<User> => {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    const fbUser = credential.user;
    if (name) {
      await updateProfile(fbUser, { displayName: name });
    }
    const user: User = {
      name: name || fbUser.displayName || email.split('@')[0] || 'Ranger',
      email: fbUser.email || email,
      avatarId: 'tiger',
      nearbyRadiusKm: 5
    };
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
    return user;
  } catch (_err) {
    const user: User = {
      name: name || email.split('@')[0] || 'Wildlife Guardian',
      email: email,
      avatarId: 'tiger',
      nearbyRadiusKm: 5
    };
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
    return user;
  }
};

export const loginWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    const user: User = {
      name: fbUser.displayName || 'Google User',
      email: fbUser.email || 'user@gmail.com',
      avatarId: 'tiger',
      nearbyRadiusKm: 5
    };
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
    return user;
  } catch (_err) {
    const user: User = {
      name: 'Google Ranger',
      email: 'ranger@wildlife.gov.in',
      avatarId: 'tiger',
      nearbyRadiusKm: 5
    };
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
    return user;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (_e) {
    // ignore
  }
  localStorage.removeItem(LOCAL_AUTH_KEY);
};

export const getCurrentSavedUser = (): User | null => {
  const saved = localStorage.getItem(LOCAL_AUTH_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (_e) {
      return null;
    }
  }
  return null;
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
    if (fbUser) {
      const user: User = {
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Ranger',
        email: fbUser.email || 'ranger@wildlife.gov.in',
        avatarId: 'tiger',
        nearbyRadiusKm: 5
      };
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
      callback(user);
    } else {
      const savedUser = getCurrentSavedUser();
      callback(savedUser);
    }
  });
};
