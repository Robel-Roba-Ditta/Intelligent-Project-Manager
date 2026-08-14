import { api } from './api';

export interface ActivityLogDto {
  id: number;
  taskId: number;
  actorId: number;
  action: string;
  details: Record<string, any>;
  createdAt: string;
  actor: { id: number; fullName: string; email: string };
}

export async function listActivity(taskId: number): Promise<ActivityLogDto[]> {
  const res = await api.get<ActivityLogDto[]>(`/tasks/${taskId}/activity`);
  return res.data;
}
