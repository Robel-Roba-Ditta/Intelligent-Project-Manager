import type { AxiosInstance } from 'axios';
import type { LabelDto, CreateLabelData, UpdateLabelData } from '../types/index.js';

export async function listLabels(api: AxiosInstance, projectId: number): Promise<LabelDto[]> {
  const res = await api.get<LabelDto[]>(`/projects/${projectId}/labels`);
  return res.data;
}

export async function createLabel(api: AxiosInstance, projectId: number, data: CreateLabelData): Promise<LabelDto> {
  const res = await api.post<LabelDto>(`/projects/${projectId}/labels`, data);
  return res.data;
}

export async function updateLabel(api: AxiosInstance, id: number, data: UpdateLabelData): Promise<LabelDto> {
  const res = await api.patch<LabelDto>(`/labels/${id}`, data);
  return res.data;
}

export async function deleteLabel(api: AxiosInstance, id: number): Promise<void> {
  await api.delete(`/labels/${id}`);
}

export async function attachLabel(api: AxiosInstance, taskId: number, labelId: number): Promise<void> {
  await api.post(`/tasks/${taskId}/labels`, { labelId });
}

export async function detachLabel(api: AxiosInstance, taskId: number, labelId: number): Promise<void> {
  await api.delete(`/tasks/${taskId}/labels/${labelId}`);
}
