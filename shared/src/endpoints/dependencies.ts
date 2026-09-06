import type { AxiosInstance } from 'axios';
import type { DependenciesResponse } from '../types/index.js';

export async function listDependencies(api: AxiosInstance, taskId: number): Promise<DependenciesResponse> {
  const res = await api.get<DependenciesResponse>(`/tasks/${taskId}/dependencies`);
  return res.data;
}

export async function createDependency(
  api: AxiosInstance,
  blockingTaskId: number,
  blockedTaskId: number,
): Promise<any> {
  const res = await api.post(`/tasks/${blockingTaskId}/dependencies`, { blockedTaskId });
  return res.data;
}

export async function deleteDependency(api: AxiosInstance, id: number): Promise<void> {
  await api.delete(`/dependencies/${id}`);
}
