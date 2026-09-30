import React, { createContext, useContext, useState } from 'react';

type AuthMode = 'login' | 'signup' | null;

interface AuthModalContextType {
  authMode: AuthMode;
  openLogin: () => void;
  openSignup: () => void;
  closeAuth: () => void;
  switchMode: (mode: 'login' | 'signup') => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authMode, setAuthMode] = useState<AuthMode>(null);

  const openLogin = () => setAuthMode('login');
  const openSignup = () => setAuthMode('signup');
  const closeAuth = () => setAuthMode(null);
  const switchMode = (mode: 'login' | 'signup') => setAuthMode(mode);

  return (
    <AuthModalContext.Provider
      value={{
        authMode,
        openLogin,
        openSignup,
        closeAuth,
        switchMode,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};
