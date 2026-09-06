import type { AxiosInstance } from 'axios';
import type { ProjectDto, ProjectMemberDto, ProjectMemberRole } from '../types/index.js';

export async function listProjects(api: AxiosInstance): Promise<ProjectDto[]> {
  const res = await api.get<ProjectDto[]>('/projects');
  return res.data;
}

export async function getProject(api: AxiosInstance, id: number): Promise<ProjectDto> {
  const res = await api.get<ProjectDto>(`/projects/${id}`);
  return res.data;
}

export async function createProject(
  api: AxiosInstance,
  data: { name: string; description?: string },
): Promise<ProjectDto> {
  const res = await api.post<ProjectDto>('/projects', data);
  return res.data;
}

export async function updateProject(
  api: AxiosInstance,
  id: number,
  data: { name?: string; description?: string },
): Promise<ProjectDto> {
  const res = await api.patch<ProjectDto>(`/projects/${id}`, data);
  return res.data;
}

export async function activateProject(api: AxiosInstance, id: number): Promise<ProjectDto> {
  const res = await api.patch<ProjectDto>(`/projects/${id}/activate`);
  return res.data;
}

export async function deactivateProject(api: AxiosInstance, id: number): Promise<ProjectDto> {
  const res = await api.patch<ProjectDto>(`/projects/${id}/deactivate`);
  return res.data;
}

export async function deleteProject(api: AxiosInstance, id: number): Promise<void> {
  await api.delete(`/projects/${id}`);
}

export async function listProjectMembers(api: AxiosInstance, projectId: number): Promise<ProjectMemberDto[]> {
  const res = await api.get<ProjectMemberDto[]>(`/projects/${projectId}/members`);
  return res.data;
}

export async function addProjectMember(
  api: AxiosInstance,
  id: number,
  data: { email: string; role?: ProjectMemberRole },
): Promise<ProjectDto> {
  const res = await api.post<ProjectDto>(`/projects/${id}/members`, data);
  return res.data;
}

export async function updateProjectMemberRole(
  api: AxiosInstance,
  id: number,
  userId: number,
  role: ProjectMemberRole,
): Promise<ProjectDto> {
  const res = await api.patch<ProjectDto>(`/projects/${id}/members/${userId}`, { role });
  return res.data;
}

export async function removeProjectMember(
  api: AxiosInstance,
  id: number,
  userId: number,
): Promise<ProjectDto> {
  const res = await api.delete<ProjectDto>(`/projects/${id}/members/${userId}`);
  return res.data;
}
