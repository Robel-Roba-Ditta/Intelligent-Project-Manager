import { api } from './api';

export type EpicStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE';

export interface EpicDto {
  id: number;
  name: string;
  description: string | null;
  status: EpicStatus;
  projectId: number;
  createdAt: string;
  updatedAt: string;
}

export async function listEpics(projectId: number): Promise<EpicDto[]> {
  const res = await api.get<EpicDto[]>(`/projects/${projectId}/epics`);
  return res.data;
}

export async function getEpic(id: number): Promise<EpicDto> {
  const res = await api.get<EpicDto>(`/epics/${id}`);
  return res.data;
}

export async function createEpic(
  projectId: number,
  data: { name: string; description?: string; status?: EpicStatus },
): Promise<EpicDto> {
  const res = await api.post<EpicDto>(`/projects/${projectId}/epics`, data);
  return res.data;
}

export async function updateEpic(
  id: number,
  data: { name?: string; description?: string; status?: EpicStatus },
): Promise<EpicDto> {
  const res = await api.patch<EpicDto>(`/epics/${id}`, data);
  return res.data;
}

export async function deleteEpic(id: number): Promise<void> {
  await api.delete(`/epics/${id}`);
}
