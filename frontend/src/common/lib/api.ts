import { createApiClient, extractErrorMessage } from '@ipm/shared';
import type { AuthUser, AuthResponse } from '@ipm/shared';
import {
  registerRequest as _registerRequest,
  loginRequest as _loginRequest,
  meRequest as _meRequest,
} from '@ipm/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'pms_access_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export const api = createApiClient({
  baseURL: API_URL,
  getToken,
});

export type { AuthUser, AuthResponse };

export async function registerRequest(data: {
  email: string;
  password: string;
  fullName: string;
}): Promise<AuthResponse> {
  return _registerRequest(api, data);
}

export async function loginRequest(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return _loginRequest(api, data);
}

export async function meRequest(): Promise<AuthUser> {
  return _meRequest(api);
}

export { extractErrorMessage };
