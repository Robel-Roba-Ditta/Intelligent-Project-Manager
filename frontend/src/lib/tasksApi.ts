import { api } from './api';
import type { LabelDto } from './labelsApi';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskType = 'TASK' | 'BUG' | 'STORY';

export interface TaskDto {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  storyPoints: number | null;
  dueDate: string | null;
  isDeleted: boolean;
  completedAt: string | null;
  projectId: number;
  epicId: number | null;
  sprintId: number | null;
  assigneeId: number | null;
  parentTaskId: number | null;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  assignee: { id: number; fullName: string; email: string } | null;
  epic: { id: number; name: string } | null;
  sprint: { id: number; name: string } | null;
  parent: { id: number; title: string } | null;
  children: TaskDto[];
  labels: LabelDto[];
  createdBy: { id: number; fullName: string; email: string } | null;
  project?: { id: number; name: string };
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  storyPoints?: number;
  dueDate?: string;
  epicId?: number;
  sprintId?: number;
  assigneeId?: number;
  parentTaskId?: number;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  type?: TaskType;
  storyPoints?: number | null;
  dueDate?: string | null;
  epicId?: number | null;
  sprintId?: number | null;
  assigneeId?: number | null;
  parentTaskId?: number | null;
}

export async function listTasks(projectId: number): Promise<TaskDto[]> {
  const res = await api.get<TaskDto[]>(`/projects/${projectId}/tasks`);
  return res.data;
}

export async function getMyTasks(): Promise<TaskDto[]> {
  const res = await api.get<TaskDto[]>('/tasks/me');
  return res.data;
}

export async function getTask(id: number): Promise<TaskDto> {
  const res = await api.get<TaskDto>(`/tasks/${id}`);
  return res.data;
}

export async function createTask(
  projectId: number,
  data: CreateTaskData,
): Promise<TaskDto> {
  const res = await api.post<TaskDto>(`/projects/${projectId}/tasks`, data);
  return res.data;
}

export async function updateTask(
  id: number,
  data: UpdateTaskData,
): Promise<TaskDto> {
  const res = await api.patch<TaskDto>(`/tasks/${id}`, data);
  return res.data;
}

export async function deleteTask(id: number): Promise<TaskDto> {
  const res = await api.delete<TaskDto>(`/tasks/${id}`);
  return res.data;
}

export async function changeTaskStatus(
  id: number,
  status: TaskStatus,
): Promise<TaskDto> {
  const res = await api.patch<TaskDto>(`/tasks/${id}/status`, { status });
  return res.data;
}
