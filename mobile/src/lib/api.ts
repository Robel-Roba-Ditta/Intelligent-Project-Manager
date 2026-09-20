import { createApiClient } from '@ipm/shared';
import { getToken, clearToken } from './authStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

export const api = createApiClient({
  baseURL: API_URL,
  getToken,
});

// Listeners for 401 — allows AuthContext to register a logout callback
type LogoutCallback = () => void;
let _onUnauthorized: LogoutCallback | null = null;

export function setOnUnauthorized(cb: LogoutCallback | null) {
  _onUnauthorized = cb;
}

// Intercept 401 responses to handle deactivated accounts gracefully
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401 && _onUnauthorized) {
      await clearToken();
      _onUnauthorized();
    }
    return Promise.reject(error);
  },
);
