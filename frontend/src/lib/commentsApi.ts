import { api } from './api';

export interface CommentDto {
  id: number;
  taskId: number;
  authorId: number;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: { id: number; fullName: string; email: string };
}

export async function listComments(taskId: number): Promise<CommentDto[]> {
  const res = await api.get<CommentDto[]>(`/tasks/${taskId}/comments`);
  return res.data;
}

export async function createComment(
  taskId: number,
  body: string,
): Promise<CommentDto> {
  const res = await api.post<CommentDto>(`/tasks/${taskId}/comments`, { body });
  return res.data;
}

export async function updateComment(
  id: number,
  body: string,
): Promise<CommentDto> {
  const res = await api.patch<CommentDto>(`/comments/${id}`, { body });
  return res.data;
}

export async function deleteComment(id: number): Promise<void> {
  await api.delete(`/comments/${id}`);
}
