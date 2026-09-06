import type { AxiosInstance } from 'axios';
import type { SprintDto, BurndownData } from '../types/index.js';

export async function listSprints(api: AxiosInstance, projectId: number): Promise<SprintDto[]> {
  const res = await api.get<SprintDto[]>(`/projects/${projectId}/sprints`);
  return res.data;
}

export async function getMyActiveSprints(api: AxiosInstance): Promise<SprintDto[]> {
  const res = await api.get<SprintDto[]>('/sprints/me/active');
  return res.data;
}

export async function getSprint(api: AxiosInstance, id: number): Promise<SprintDto> {
  const res = await api.get<SprintDto>(`/sprints/${id}`);
  return res.data;
}

export async function createSprint(
  api: AxiosInstance,
  projectId: number,
  data: { name: string; goal?: string },
): Promise<SprintDto> {
  const res = await api.post<SprintDto>(`/projects/${projectId}/sprints`, data);
  return res.data;
}

export async function updateSprint(
  api: AxiosInstance,
  id: number,
  data: { name?: string; goal?: string },
): Promise<SprintDto> {
  const res = await api.patch<SprintDto>(`/sprints/${id}`, data);
  return res.data;
}

export async function deleteSprint(api: AxiosInstance, id: number): Promise<void> {
  await api.delete(`/sprints/${id}`);
}

export async function startSprint(api: AxiosInstance, id: number): Promise<SprintDto> {
  const res = await api.post<SprintDto>(`/sprints/${id}/start`);
  return res.data;
}

export async function completeSprint(api: AxiosInstance, id: number): Promise<SprintDto> {
  const res = await api.post<SprintDto>(`/sprints/${id}/complete`);
  return res.data;
}

export async function getSprintBurndown(api: AxiosInstance, id: number): Promise<BurndownData> {
  const res = await api.get<BurndownData>(`/sprints/${id}/burndown`);
  return res.data;
}
