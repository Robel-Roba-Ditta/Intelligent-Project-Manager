import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  type AuthUser,
  loginRequest,
  registerRequest,
  meRequest,
  getToken,
  setToken,
  clearToken,
} from '../lib/api';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean; // true while we check for an existing saved session
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    meRequest()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user, accessToken } = await loginRequest({ email, password });
    setToken(accessToken);
    setUser(user);
  }, []);

  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      const { user, accessToken } = await registerRequest({ email, password, fullName });
      setToken(accessToken);
      setUser(user);
    },
    [],
  );

  const logout = useCallback(() => {
    clearToken();
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
