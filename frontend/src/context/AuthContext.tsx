import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  confirmPasswordReset,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { authApi } from '../api/auth';
import type { User, UserRole, LoginPayload, RegisterPayload } from '../types';
import { disconnectRealtimeSocket } from '../realtime/socket';
import { setInstructorOverride } from '../api/client';

// Per-login data kept in sessionStorage (survives logout until the window closes):
// the student's cached enrollment list and the admin "act as instructor" override.
const clearSessionScopedData = () => {
  try {
    sessionStorage.removeItem('edtech_student_enrolled_courses');
  } catch {
    // ignore
  }
  setInstructorOverride(null);
};

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<{ success: boolean; role?: UserRole; isProfileCompleted?: boolean; instructorId?: string; message?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; role?: UserRole; isProfileCompleted?: boolean; instructorId?: string; message?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; role?: UserRole; isProfileCompleted?: boolean; instructorId?: string; message?: string }>;
  loginWithFirebaseEmail: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; isProfileCompleted?: boolean; instructorId?: string; message?: string }>;
  registerWithFirebaseEmail: (email: string, password: string, name?: string) => Promise<{ success: boolean; role?: UserRole; isProfileCompleted?: boolean; instructorId?: string; message?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  confirmResetPassword: (payload: { oobCode?: string; token?: string; newPassword: string }) => Promise<{ success: boolean; message: string }>;
  logout: (redirectPath?: string) => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  getRedirectPathForRole: (role: UserRole, isProfileCompleted?: boolean, instructorId?: string) => string;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('accessToken');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getRedirectPathForRole = (role: UserRole, isProfileCompleted?: boolean, instructorId?: string): string => {
    switch (role) {
      case 'SUPER_ADMIN':
        return '/super-admin';
      case 'ADMIN':
        return '/dashboard/admin';
      case 'INSTRUCTOR':
        if (isProfileCompleted === false) {
          return '/instructor/onboarding';
        }
        const effectiveId = instructorId || user?.instructorId || user?._id || user?.id;
        return effectiveId ? `/dashboard/instructor/${effectiveId}` : '/dashboard/instructor';
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

  // Restore authenticated session on mount and listen to session expiration
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
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          clearSessionScopedData();
          setUser(null);
          setAccessToken(null);
        }
      }
      setIsLoading(false);
    };

    const handleSessionExpired = () => {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      clearSessionScopedData();
    };

    window.addEventListener('auth:session_expired', handleSessionExpired);
    restoreSession();

    return () => {
      window.removeEventListener('auth:session_expired', handleSessionExpired);
    };
  }, []);

  // 1. Unified Email/Password Login with Strict Single Password Authority
  const login = async (payload: LoginPayload) => {
    setError(null);
    const cleanEmail = payload.email.trim().toLowerCase();
    const password = payload.password;

    // Determine account authentication authority
    let isFirebaseEnrolled = false;
    try {
      const checkRes = await authApi.checkAuthMethod(cleanEmail);
      if (checkRes.success && checkRes.data) {
        isFirebaseEnrolled = checkRes.data.isFirebaseEnrolled;
      }
    } catch {
      // Default to false if check fails, but backend will still enforce single authority
    }

    // Branch A: Accounts linked to Firebase Authentication
    // Authenticate exclusively through Firebase. A failed login MUST NEVER fall back to legacy MongoDB hash!
    if (isFirebaseEnrolled) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const idToken = await userCredential.user.getIdToken();
        const res = await authApi.firebaseLogin(idToken);
        if (res.success && res.data) {
          const { user: authUser, accessToken: token, refreshToken } = res.data;
          setUser(authUser);
          setAccessToken(token);
          localStorage.setItem('accessToken', token);
          if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('user', JSON.stringify(authUser));
          return {
            success: true,
            role: authUser.role,
            isProfileCompleted: authUser.isProfileCompleted,
            instructorId: authUser.instructorId,
          };
        }
        return { success: false, message: res.message || 'Login failed.' };
      } catch (fbErr: any) {
        // Enforce strict rejection for Firebase-managed accounts
        const msg = 'Invalid email or password.';
        setError(msg);
        return { success: false, message: msg };
      }
    }

    // Branch B: Unmigrated legacy accounts (not yet linked to Firebase)
    try {
      const res = await authApi.login({ email: cleanEmail, password });
      if (res.success && res.data) {
        const { user: authUser, accessToken: token, refreshToken } = res.data;
        setUser(authUser);
        setAccessToken(token);
        localStorage.setItem('accessToken', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(authUser));

        // Background migration to Firebase Auth:
        // Provision credentials in Firebase so all future password resets and logins are unified under Firebase
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password).catch(() => null);
          if (userCredential) {
            const idToken = await userCredential.user.getIdToken();
            await authApi.firebaseLogin(idToken).catch(() => {});
          }
        } catch {
          // Migration is best-effort and non-blocking
        }

        return {
          success: true,
          role: authUser.role,
          isProfileCompleted: authUser.isProfileCompleted,
          instructorId: authUser.instructorId,
        };
      }
      return { success: false, message: res.message || 'Invalid email or password.' };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // 2. Dual Registration (Creates in Firebase Auth for reset security + Registers in MongoDB)
  const register = async (payload: RegisterPayload) => {
    setError(null);
    try {
      const cleanEmail = payload.email.trim().toLowerCase();
      // Ensure user is provisioned in Firebase Auth so password resets work immediately
      try {
        await createUserWithEmailAndPassword(auth, cleanEmail, payload.password);
      } catch (fbErr: any) {
        console.warn('[Firebase Register non-fatal]', fbErr.code || fbErr.message);
      }

      const res = await authApi.register(payload);
      if (res.success && res.data) {
        const { user: authUser, accessToken: token, refreshToken } = res.data;
        setUser(authUser);
        setAccessToken(token);
        localStorage.setItem('accessToken', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(authUser));
        return { success: true, role: authUser.role, isProfileCompleted: authUser.isProfileCompleted, instructorId: authUser.instructorId };
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
        const { user: authUser, accessToken: token, refreshToken } = res.data;
        setUser(authUser);
        setAccessToken(token);
        localStorage.setItem('accessToken', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(authUser));
        return { success: true, role: authUser.role, isProfileCompleted: authUser.isProfileCompleted, instructorId: authUser.instructorId };
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
        const { user: authUser, accessToken: token, refreshToken } = res.data;
        setUser(authUser);
        setAccessToken(token);
        localStorage.setItem('accessToken', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(authUser));
        return { success: true, role: authUser.role, isProfileCompleted: authUser.isProfileCompleted, instructorId: authUser.instructorId };
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
        const { user: authUser, accessToken: token, refreshToken } = res.data;
        setUser(authUser);
        setAccessToken(token);
        localStorage.setItem('accessToken', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(authUser));
        return { success: true, role: authUser.role, isProfileCompleted: authUser.isProfileCompleted, instructorId: authUser.instructorId };
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

  // 6. Seamless Password Reset (Firebase + Backend sync)
  const sendPasswordReset = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    // 1. Try Firebase Auth Password Reset Email with redirect to our app
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, cleanEmail, actionCodeSettings);
    } catch (fbErr: any) {
      console.warn('[Firebase Reset with ActionCodeSettings]', fbErr.message);
      // Fallback without actionCodeSettings if domain is not whitelisted yet
      try {
        await sendPasswordResetEmail(auth, cleanEmail);
      } catch (fbErr2: any) {
        console.warn('[Firebase Reset basic]', fbErr2.message);
      }
    }

    // 2. Also trigger backend reset token generation
    try {
      await authApi.forgotPassword(cleanEmail);
    } catch (beErr: any) {
      console.warn('[Backend Reset]', beErr.message);
    }

    return {
      success: true,
      message: 'If an account exists with this email address, password reset instructions have been dispatched to your inbox.',
    };
  };

  // 6b. Confirm Password Reset with Token or Firebase Code
  const confirmResetPassword = async (payload: { oobCode?: string; token?: string; newPassword: string }) => {
    const { oobCode, token, newPassword } = payload;
    let fbDone = false;
    let beDone = false;
    let errorMsg = '';

    // If Firebase action code provided
    if (oobCode) {
      try {
        await confirmPasswordReset(auth, oobCode, newPassword);
        fbDone = true;
      } catch (err: any) {
        errorMsg = err.message || 'Firebase reset code is invalid or expired.';
      }
    }

    // If backend reset token provided
    if (token) {
      try {
        await authApi.resetPassword({ token, newPassword });
        beDone = true;
      } catch (err: any) {
        errorMsg = err.response?.data?.message || err.message || errorMsg || 'Reset token is invalid or expired.';
      }
    }

    if (fbDone || beDone) {
      return { success: true, message: 'Password reset successfully! You can now log in with your new password.' };
    }

    return { success: false, message: errorMsg || 'Failed to reset password. The link may be invalid or expired.' };
  };

  // 7. Logout User
  const logout = async (redirectPath: string = '/') => {
    disconnectRealtimeSocket();
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
      clearSessionScopedData();
      setUser(null);
      setAccessToken(null);
      // Explicit redirect to "/" (landing page) on logout
      window.location.href = redirectPath;
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
        confirmResetPassword,
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


export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    // Return resilient default during HMR or edge-case initial tree evaluations
    return {
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      login: async () => ({ success: false, message: 'Authentication initializing...' }),
      register: async () => ({ success: false, message: 'Authentication initializing...' }),
      loginWithGoogle: async () => ({ success: false, message: 'Authentication initializing...' }),
      loginWithFirebaseEmail: async () => ({ success: false, message: 'Authentication initializing...' }),
      registerWithFirebaseEmail: async () => ({ success: false, message: 'Authentication initializing...' }),
      sendPasswordReset: async () => ({ success: false, message: 'Authentication initializing...' }),
      confirmResetPassword: async () => ({ success: false, message: 'Authentication initializing...' }),
      logout: async () => {},
      updateUser: () => {},
      refreshUser: async () => {},
      getRedirectPathForRole: () => '/',
    };
  }
  return context;
};
