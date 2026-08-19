import { api } from './api';

export type SprintStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED';

export interface SprintDto {
  id: number;
  name: string;
  goal: string | null;
  status: SprintStatus;
  startDate: string | null;
  endDate: string | null;
  projectId: number;
  createdAt: string;
  updatedAt: string;
  project?: { id: number; name: string };
}

export async function listSprints(projectId: number): Promise<SprintDto[]> {
  const res = await api.get<SprintDto[]>(`/projects/${projectId}/sprints`);
  return res.data;
}

export async function getMyActiveSprints(): Promise<SprintDto[]> {
  const res = await api.get<SprintDto[]>('/sprints/me/active');
  return res.data;
}

export async function getSprint(id: number): Promise<SprintDto> {
  const res = await api.get<SprintDto>(`/sprints/${id}`);
  return res.data;
}

export async function createSprint(
  projectId: number,
  data: { name: string; goal?: string },
): Promise<SprintDto> {
  const res = await api.post<SprintDto>(`/projects/${projectId}/sprints`, data);
  return res.data;
}

export async function updateSprint(
  id: number,
  data: { name?: string; goal?: string },
): Promise<SprintDto> {
  const res = await api.patch<SprintDto>(`/sprints/${id}`, data);
  return res.data;
}

export async function deleteSprint(id: number): Promise<void> {
  await api.delete(`/sprints/${id}`);
}

export async function startSprint(id: number): Promise<SprintDto> {
  const res = await api.post<SprintDto>(`/sprints/${id}/start`);
  return res.data;
}

export async function completeSprint(id: number): Promise<SprintDto> {
  const res = await api.post<SprintDto>(`/sprints/${id}/complete`);
  return res.data;
}

export interface BurndownDay {
  date: string;
  idealRemaining: number;
  actualRemaining: number;
}

export interface BurndownData {
  sprintName: string;
  startDate: string;
  endDate: string;
  totalTasks: number;
  days: BurndownDay[];
}

export async function getSprintBurndown(id: number): Promise<BurndownData> {
  const res = await api.get<BurndownData>(`/sprints/${id}/burndown`);
  return res.data;
}
