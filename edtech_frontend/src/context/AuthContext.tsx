import React, { createContext, useContext, useState, useEffect } from 'react';
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
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
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

  const login = async (payload: LoginPayload) => {
    setError(null);
    try {
      const res = await authApi.login(payload);
      if (res.success && res.data) {
        const { user: authUser, accessToken: token } = res.data;
        setUser(authUser);
        setAccessToken(token);
        localStorage.setItem('accessToken', token);
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

  const register = async (payload: RegisterPayload) => {
    setError(null);
    try {
      const res = await authApi.register(payload);
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
      const msg = err.response?.data?.message || err.message || 'Registration failed.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore network errors on logout
    } finally {
      localStorage.removeItem('accessToken');
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
        logout,
        updateUser,
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
