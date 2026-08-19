import { api } from '../../../common/lib/api';

export async function watchTask(taskId: number): Promise<{ watching: boolean }> {
  const res = await api.post<{ watching: boolean }>(`/tasks/${taskId}/watch`);
  return res.data;
}

export async function unwatchTask(taskId: number): Promise<{ watching: boolean }> {
  const res = await api.delete<{ watching: boolean }>(`/tasks/${taskId}/watch`);
  return res.data;
}

export async function getWatchStatus(taskId: number): Promise<{ watching: boolean }> {
  const res = await api.get<{ watching: boolean }>(`/tasks/${taskId}/watch`);
  return res.data;
}
