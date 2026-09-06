import type { AxiosInstance } from 'axios';
import type { AttachmentDto } from '../types/index.js';

export async function listAttachments(api: AxiosInstance, taskId: number): Promise<AttachmentDto[]> {
  const res = await api.get<AttachmentDto[]>(`/tasks/${taskId}/attachments`);
  return res.data;
}

export async function createAttachment(
  api: AxiosInstance,
  taskId: number,
  data: { fileName: string; fileUrl: string },
): Promise<AttachmentDto> {
  const res = await api.post<AttachmentDto>(`/tasks/${taskId}/attachments`, data);
  return res.data;
}

export async function deleteAttachment(api: AxiosInstance, id: number): Promise<void> {
  await api.delete(`/attachments/${id}`);
}
