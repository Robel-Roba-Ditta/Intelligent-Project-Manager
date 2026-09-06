import type { AxiosInstance } from 'axios';

export async function watchTask(api: AxiosInstance, taskId: number): Promise<{ watching: boolean }> {
  const res = await api.post<{ watching: boolean }>(`/tasks/${taskId}/watch`);
  return res.data;
}

export async function unwatchTask(api: AxiosInstance, taskId: number): Promise<{ watching: boolean }> {
  const res = await api.delete<{ watching: boolean }>(`/tasks/${taskId}/watch`);
  return res.data;
}

export async function getWatchStatus(api: AxiosInstance, taskId: number): Promise<{ watching: boolean }> {
  const res = await api.get<{ watching: boolean }>(`/tasks/${taskId}/watch`);
  return res.data;
}
