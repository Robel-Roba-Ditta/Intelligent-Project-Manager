import { api } from './api';

export interface UserDto {
  id: number;
  email: string;
  fullName: string;
}

export async function listUsers(): Promise<UserDto[]> {
  const res = await api.get<UserDto[]>('/users');
  return res.data;
}
