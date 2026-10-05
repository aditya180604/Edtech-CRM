import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { authApi } from '../api/auth';
import type { User, UserRole, LoginPayload, RegisterPayload } from '../types';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<{ success: boolean; role?: UserRole; isProfileCompleted?: boolean; message?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; role?: UserRole; isProfileCompleted?: boolean; message?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; role?: UserRole; isProfileCompleted?: boolean; message?: string }>;
  loginWithFirebaseEmail: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; isProfileCompleted?: boolean; message?: string }>;
  registerWithFirebaseEmail: (email: string, password: string, name?: string) => Promise<{ success: boolean; role?: UserRole; isProfileCompleted?: boolean; message?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  getRedirectPathForRole: (role: UserRole, isProfileCompleted?: boolean) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('accessToken');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getRedirectPathForRole = (role: UserRole, isProfileCompleted?: boolean): string => {
    switch (role) {
      case 'SUPER_ADMIN':
        return '/super-admin';
      case 'ADMIN':
        return '/dashboard/admin';
      case 'INSTRUCTOR':
        if (isProfileCompleted === false) {
          return '/instructor/onboarding';
        }
        return '/dashboard/instructor';
      case 'STUDENT':
      default:
        return '/dashboard/student';
    }
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      }
    } catch (e) {
      console.error('Failed to refresh user profile:', e);
    }
  };

  // Restore authenticated session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
          }
        } catch {
          // Token expired or invalid
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          setUser(null);
          setAccessToken(null);
        }
      }
      setIsLoading(false);
    };
    restoreSession();
  }, []);

  // 1. Existing Traditional Email/Password Login
  const login = async (payload: LoginPayload) => {
    setError(null);
    try {
      const res = await authApi.login(payload);
      if (res.success && res.data) {
        const { user: authUser, accessToken: token, refreshToken } = res.data;
        setUser(authUser);
        setAccessToken(token);
        localStorage.setItem('accessToken', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(authUser));
        return { success: true, role: authUser.role, isProfileCompleted: authUser.isProfileCompleted };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // 2. Existing Traditional Registration
  const register = async (payload: RegisterPayload) => {
    setError(null);
    try {
      const res = await authApi.register(payload);
      if (res.success && res.data) {
        const { user: authUser, accessToken: token, refreshToken } = res.data;
        setUser(authUser);
        setAccessToken(token);
        localStorage.setItem('accessToken', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(authUser));
        return { success: true, role: authUser.role, isProfileCompleted: authUser.isProfileCompleted };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // 3. Google Sign-In via Firebase
  const loginWithGoogle = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const res = await authApi.firebaseLogin(idToken);
      if (res.success && res.data) {
        const { user: authUser, accessToken: token } = res.data;
        setUser(authUser);
        setAccessToken(token);
        localStorage.setItem('accessToken', token);
        localStorage.setItem('user', JSON.stringify(authUser));
        return { success: true, role: authUser.role, isProfileCompleted: authUser.isProfileCompleted };
      }
      return { success: false, message: res.message || 'Google authentication failed' };
    } catch (err: any) {
      const msg =
        err.code === 'auth/popup-closed-by-user'
          ? 'Sign in popup was closed.'
          : err.response?.data?.message || err.message || 'Google sign in failed.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // 4. Firebase Email/Password Sign-In
  const loginWithFirebaseEmail = async (email: string, password: string) => {
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      const res = await authApi.firebaseLogin(idToken);
      if (res.success && res.data) {
        const { user: authUser, accessToken: token } = res.data;
        setUser(authUser);
        setAccessToken(token);
        localStorage.setItem('accessToken', token);
        localStorage.setItem('user', JSON.stringify(authUser));
        return { success: true, role: authUser.role, isProfileCompleted: authUser.isProfileCompleted };
      }
      return { success: false, message: res.message || 'Firebase login failed' };
    } catch (err: any) {
      const msg =
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
          ? 'Invalid email or password.'
          : err.response?.data?.message || err.message || 'Firebase sign in failed.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // 5. Firebase Email/Password Registration
  const registerWithFirebaseEmail = async (email: string, password: string, name?: string) => {
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await updateProfile(userCredential.user, { displayName: name });
      }
      const idToken = await userCredential.user.getIdToken();
      const res = await authApi.firebaseLogin(idToken);
      if (res.success && res.data) {
        const { user: authUser, accessToken: token } = res.data;
        setUser(authUser);
        setAccessToken(token);
        localStorage.setItem('accessToken', token);
        localStorage.setItem('user', JSON.stringify(authUser));
        return { success: true, role: authUser.role, isProfileCompleted: authUser.isProfileCompleted };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err: any) {
      const msg =
        err.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists.'
          : err.response?.data?.message || err.message || 'Registration failed.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // 6. Firebase Password Reset
  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent successfully.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to send reset email.' };
    }
  };

  // 7. Logout User
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    try {
      await authApi.logout();
    } catch {
      // ignore network errors on logout
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setAccessToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        loginWithGoogle,
        loginWithFirebaseEmail,
        registerWithFirebaseEmail,
        sendPasswordReset,
        logout,
        updateUser,
        refreshUser,
        getRedirectPathForRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
