import type { AxiosInstance } from 'axios';
import type { ActivityLogDto } from '../types/index.js';

export async function listActivity(api: AxiosInstance, taskId: number): Promise<ActivityLogDto[]> {
  const res = await api.get<ActivityLogDto[]>(`/tasks/${taskId}/activity`);
  return res.data;
}
