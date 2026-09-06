import type { AxiosInstance } from 'axios';
import type { TimeLogDto, TimeLogsResponse } from '../types/index.js';

export async function listTimeLogs(api: AxiosInstance, taskId: number): Promise<TimeLogsResponse> {
  const res = await api.get<TimeLogsResponse>(`/tasks/${taskId}/time-logs`);
  return res.data;
}

export async function createTimeLog(
  api: AxiosInstance,
  taskId: number,
  data: { hours: number; date: string },
): Promise<TimeLogDto> {
  const res = await api.post<TimeLogDto>(`/tasks/${taskId}/time-logs`, data);
  return res.data;
}

export async function deleteTimeLog(api: AxiosInstance, id: number): Promise<void> {
  await api.delete(`/time-logs/${id}`);
}
