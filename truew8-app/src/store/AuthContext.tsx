import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { login as loginRequest, register as registerRequest } from '@/src/services/auth';
import { clearSession, loadSession, saveSession } from '@/src/services/authStorage';
import { setAuthTokenGetter, setUnauthorizedHandler } from '@/src/services/api';

type AuthContextValue = {
  token: string | null;
  email: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setAuthTokenGetter(() => token);
  }, [token]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setEmail(null);
      void clearSession();
    });

    return () => {
      setUnauthorizedHandler(() => {});
    };
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const session = await loadSession();
      setToken(session?.token ?? null);
      setEmail(session?.email ?? null);
      setIsLoading(false);
    };

    void bootstrap();
  }, []);

  const register = async (rawEmail: string, password: string) => {
    const response = await registerRequest({ email: rawEmail.trim(), password });
    setToken(response.token);
    setEmail(response.email);
    await saveSession({ token: response.token, email: response.email });
  };

  const login = async (rawEmail: string, password: string) => {
    const response = await loginRequest({ email: rawEmail.trim(), password });
    setToken(response.token);
    setEmail(response.email);
    await saveSession({ token: response.token, email: response.email });
  };

  const logout = async () => {
    setToken(null);
    setEmail(null);
    await clearSession();
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      email,
      isLoading,
      isAuthenticated: Boolean(token),
      register,
      login,
      logout,
    }),
    [token, email, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
