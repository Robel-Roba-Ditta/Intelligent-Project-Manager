import type { AxiosInstance } from 'axios';
import type { EpicDto, EpicStatus } from '../types/index.js';

export async function listEpics(api: AxiosInstance, projectId: number): Promise<EpicDto[]> {
  const res = await api.get<EpicDto[]>(`/projects/${projectId}/epics`);
  return res.data;
}

export async function getEpic(api: AxiosInstance, id: number): Promise<EpicDto> {
  const res = await api.get<EpicDto>(`/epics/${id}`);
  return res.data;
}

export async function createEpic(
  api: AxiosInstance,
  projectId: number,
  data: { name: string; description?: string; status?: EpicStatus },
): Promise<EpicDto> {
  const res = await api.post<EpicDto>(`/projects/${projectId}/epics`, data);
  return res.data;
}

export async function updateEpic(
  api: AxiosInstance,
  id: number,
  data: { name?: string; description?: string; status?: EpicStatus },
): Promise<EpicDto> {
  const res = await api.patch<EpicDto>(`/epics/${id}`, data);
  return res.data;
}

export async function deleteEpic(api: AxiosInstance, id: number): Promise<void> {
  await api.delete(`/epics/${id}`);
}
