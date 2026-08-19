import { api } from '../../../common/lib/api';

export type ProjectMemberRole = 'owner' | 'admin' | 'member';

export interface ProjectMemberDto {
  id: number;
  userId: number;
  role: ProjectMemberRole;
  user: {
    id: number;
    fullName: string;
    email: string;
  };
}

export interface ProjectDto {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdById: number;
  createdBy: {
    id: number;
    fullName: string;
    email: string;
  };
  members: ProjectMemberDto[];
}

export async function listProjects(): Promise<ProjectDto[]> {
  const res = await api.get<ProjectDto[]>('/projects');
  return res.data;
}

export async function getProject(id: number): Promise<ProjectDto> {
  const res = await api.get<ProjectDto>(`/projects/${id}`);
  return res.data;
}

export async function createProject(data: {
  name: string;
  description?: string;
}): Promise<ProjectDto> {
  const res = await api.post<ProjectDto>('/projects', data);
  return res.data;
}

export async function updateProject(
  id: number,
  data: { name?: string; description?: string },
): Promise<ProjectDto> {
  const res = await api.patch<ProjectDto>(`/projects/${id}`, data);
  return res.data;
}

export async function activateProject(id: number): Promise<ProjectDto> {
  const res = await api.patch<ProjectDto>(`/projects/${id}/activate`);
  return res.data;
}

export async function deactivateProject(id: number): Promise<ProjectDto> {
  const res = await api.patch<ProjectDto>(`/projects/${id}/deactivate`);
  return res.data;
}

export async function deleteProject(id: number): Promise<void> {
  await api.delete(`/projects/${id}`);
}

export async function listProjectMembers(projectId: number): Promise<ProjectMemberDto[]> {
  const res = await api.get<ProjectMemberDto[]>(`/projects/${projectId}/members`);
  return res.data;
}

export async function addProjectMember(
  id: number,
  data: { email: string; role?: ProjectMemberRole },
): Promise<ProjectDto> {
  const res = await api.post<ProjectDto>(`/projects/${id}/members`, data);
  return res.data;
}

export async function updateProjectMemberRole(
  id: number,
  userId: number,
  role: ProjectMemberRole,
): Promise<ProjectDto> {
  const res = await api.patch<ProjectDto>(`/projects/${id}/members/${userId}`, { role });
  return res.data;
}

export async function removeProjectMember(id: number, userId: number): Promise<ProjectDto> {
  const res = await api.delete<ProjectDto>(`/projects/${id}/members/${userId}`);
  return res.data;
}
