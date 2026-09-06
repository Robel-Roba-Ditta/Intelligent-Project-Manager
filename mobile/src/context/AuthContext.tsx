import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { AuthUser, AuthResponse } from '@ipm/shared';
import {
  registerRequest as _registerRequest,
  loginRequest as _loginRequest,
  meRequest as _meRequest,
} from '@ipm/shared';
import { api } from '../lib/api';
import { getToken, setToken, clearToken } from '../lib/authStorage';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await _meRequest(api);
        setUser(me);
      } catch {
        await clearToken();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: u, accessToken } = await _loginRequest(api, { email, password });
    await setToken(accessToken);
    setUser(u);
  }, []);

  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      const { user: u, accessToken } = await _registerRequest(api, { email, password, fullName });
      await setToken(accessToken);
      setUser(u);
    },
    [],
  );

  const logout = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
