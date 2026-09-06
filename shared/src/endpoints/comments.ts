import type { AxiosInstance } from 'axios';
import type { CommentDto } from '../types/index.js';

export async function listComments(api: AxiosInstance, taskId: number): Promise<CommentDto[]> {
  const res = await api.get<CommentDto[]>(`/tasks/${taskId}/comments`);
  return res.data;
}

export async function createComment(
  api: AxiosInstance,
  taskId: number,
  body: string,
): Promise<CommentDto> {
  const res = await api.post<CommentDto>(`/tasks/${taskId}/comments`, { body });
  return res.data;
}

export async function updateComment(
  api: AxiosInstance,
  id: number,
  body: string,
): Promise<CommentDto> {
  const res = await api.patch<CommentDto>(`/comments/${id}`, { body });
  return res.data;
}

export async function deleteComment(api: AxiosInstance, id: number): Promise<void> {
  await api.delete(`/comments/${id}`);
}
