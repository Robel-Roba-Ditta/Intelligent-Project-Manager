import type { AxiosInstance } from 'axios';
import type { UserDto } from '../types/index.js';

export async function listUsers(api: AxiosInstance): Promise<UserDto[]> {
  const res = await api.get<UserDto[]>('/users');
  return res.data;
}

export async function setUserActive(api: AxiosInstance, userId: number, isActive: boolean): Promise<UserDto> {
  const res = await api.patch<UserDto>(`/users/${userId}/active`, { isActive });
  return res.data;
}
