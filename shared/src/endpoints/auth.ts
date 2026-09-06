import type { AxiosInstance } from 'axios';
import type { AuthUser, AuthResponse } from '../types/index.js';

export async function registerRequest(
  api: AxiosInstance,
  data: { email: string; password: string; fullName: string },
): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/register', data);
  return res.data;
}

export async function loginRequest(
  api: AxiosInstance,
  data: { email: string; password: string },
): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/login', data);
  return res.data;
}

export async function meRequest(api: AxiosInstance): Promise<AuthUser> {
  const res = await api.get<AuthUser>('/auth/me');
  return res.data;
}
