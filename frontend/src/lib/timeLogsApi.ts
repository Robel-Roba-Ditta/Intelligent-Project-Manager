import { api } from './api';

export interface TimeLogDto {
  id: number;
  taskId: number;
  userId: number;
  hours: number;
  date: string;
  createdAt: string;
  user: { id: number; fullName: string; email: string };
}

export interface TimeLogsResponse {
  entries: TimeLogDto[];
  totalHours: number;
}

export async function listTimeLogs(taskId: number): Promise<TimeLogsResponse> {
  const res = await api.get<TimeLogsResponse>(`/tasks/${taskId}/time-logs`);
  return res.data;
}

export async function createTimeLog(
  taskId: number,
  data: { hours: number; date: string },
): Promise<TimeLogDto> {
  const res = await api.post<TimeLogDto>(`/tasks/${taskId}/time-logs`, data);
  return res.data;
}

export async function deleteTimeLog(id: number): Promise<void> {
  await api.delete(`/time-logs/${id}`);
}
