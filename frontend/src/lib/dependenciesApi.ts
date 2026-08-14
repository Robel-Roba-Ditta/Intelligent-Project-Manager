import { api } from './api';
import type { TaskStatus } from './tasksApi';

export interface DependencyTaskRef {
  dependencyId: number;
  task: { id: number; title: string; status: TaskStatus };
}

export interface DependenciesResponse {
  blocks: DependencyTaskRef[];
  blockedBy: DependencyTaskRef[];
}

export async function listDependencies(taskId: number): Promise<DependenciesResponse> {
  const res = await api.get<DependenciesResponse>(`/tasks/${taskId}/dependencies`);
  return res.data;
}

export async function createDependency(
  blockingTaskId: number,
  blockedTaskId: number,
): Promise<any> {
  const res = await api.post(`/tasks/${blockingTaskId}/dependencies`, { blockedTaskId });
  return res.data;
}

export async function deleteDependency(id: number): Promise<void> {
  await api.delete(`/dependencies/${id}`);
}
