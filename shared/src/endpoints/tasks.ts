import type { AxiosInstance } from 'axios';
import type { TaskDto, CreateTaskData, UpdateTaskData, TaskFilters, TaskStatus } from '../types/index.js';

export async function listTasks(api: AxiosInstance, projectId: number, filters?: TaskFilters): Promise<TaskDto[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.priority) params.set('priority', filters.priority);
  if (filters?.assigneeId) params.set('assigneeId', String(filters.assigneeId));
  if (filters?.sprintId) params.set('sprintId', String(filters.sprintId));
  if (filters?.search) params.set('search', filters.search);
  const qs = params.toString();
  const res = await api.get<TaskDto[]>(`/projects/${projectId}/tasks${qs ? '?' + qs : ''}`);
  return res.data;
}

export async function getMyTasks(api: AxiosInstance): Promise<TaskDto[]> {
  const res = await api.get<TaskDto[]>('/tasks/me');
  return res.data;
}

export async function getTask(api: AxiosInstance, id: number): Promise<TaskDto> {
  const res = await api.get<TaskDto>(`/tasks/${id}`);
  return res.data;
}

export async function createTask(
  api: AxiosInstance,
  projectId: number,
  data: CreateTaskData,
): Promise<TaskDto> {
  const res = await api.post<TaskDto>(`/projects/${projectId}/tasks`, data);
  return res.data;
}

export async function updateTask(
  api: AxiosInstance,
  id: number,
  data: UpdateTaskData,
): Promise<TaskDto> {
  const res = await api.patch<TaskDto>(`/tasks/${id}`, data);
  return res.data;
}

export async function deleteTask(api: AxiosInstance, id: number): Promise<TaskDto> {
  const res = await api.delete<TaskDto>(`/tasks/${id}`);
  return res.data;
}

export async function changeTaskStatus(
  api: AxiosInstance,
  id: number,
  status: TaskStatus,
): Promise<TaskDto> {
  const res = await api.patch<TaskDto>(`/tasks/${id}/status`, { status });
  return res.data;
}
