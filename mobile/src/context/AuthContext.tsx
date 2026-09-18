import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import type { AuthUser, AuthResponse } from '@ipm/shared';
import {
  registerRequest as _registerRequest,
  loginRequest as _loginRequest,
  meRequest as _meRequest,
} from '@ipm/shared';
import { api } from '../lib/api';
import { getToken, setToken, clearToken } from '../lib/authStorage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerPushToken() {
  try {
    if (!Device.isDevice) return; // Push only works on real devices

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const pushToken = await Notifications.getExpoPushTokenAsync();
    const token = pushToken.data;

    // Register with backend
    await api.post('/users/me/push-token', { token });

    // Android needs a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
  } catch {
    // Push registration is best-effort
  }
}

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
        // Register push token on session restore
        registerPushToken();
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
    // Register push token after login
    registerPushToken();
  }, []);

  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      const { user: u, accessToken } = await _registerRequest(api, { email, password, fullName });
      await setToken(accessToken);
      setUser(u);
      // Register push token after registration
      registerPushToken();
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
