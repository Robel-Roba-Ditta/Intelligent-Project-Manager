import { api } from './api';

export interface LabelDto {
  id: number;
  name: string;
  color: string;
  projectId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabelData {
  name: string;
  color: string;
}

export interface UpdateLabelData {
  name?: string;
  color?: string;
}

export async function listLabels(projectId: number): Promise<LabelDto[]> {
  const res = await api.get<LabelDto[]>(`/projects/${projectId}/labels`);
  return res.data;
}

export async function createLabel(projectId: number, data: CreateLabelData): Promise<LabelDto> {
  const res = await api.post<LabelDto>(`/projects/${projectId}/labels`, data);
  return res.data;
}

export async function updateLabel(id: number, data: UpdateLabelData): Promise<LabelDto> {
  const res = await api.patch<LabelDto>(`/labels/${id}`, data);
  return res.data;
}

export async function deleteLabel(id: number): Promise<void> {
  await api.delete(`/labels/${id}`);
}

export async function attachLabel(taskId: number, labelId: number): Promise<void> {
  await api.post(`/tasks/${taskId}/labels`, { labelId });
}

export async function detachLabel(taskId: number, labelId: number): Promise<void> {
  await api.delete(`/tasks/${taskId}/labels/${labelId}`);
}
