import { api } from '../../../common/lib/api';

export interface AttachmentDto {
  id: number;
  taskId: number;
  fileName: string;
  fileUrl: string;
  addedById: number;
  createdAt: string;
  addedBy: { id: number; fullName: string; email: string };
}

export async function listAttachments(taskId: number): Promise<AttachmentDto[]> {
  const res = await api.get<AttachmentDto[]>(`/tasks/${taskId}/attachments`);
  return res.data;
}

export async function createAttachment(
  taskId: number,
  data: { fileName: string; fileUrl: string },
): Promise<AttachmentDto> {
  const res = await api.post<AttachmentDto>(`/tasks/${taskId}/attachments`, data);
  return res.data;
}

export async function deleteAttachment(id: number): Promise<void> {
  await api.delete(`/attachments/${id}`);
}
