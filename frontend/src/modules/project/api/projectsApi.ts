import { api } from '../../../common/lib/api';
import {
  listProjects as _listProjects,
  getProject as _getProject,
  createProject as _createProject,
  updateProject as _updateProject,
  activateProject as _activateProject,
  deactivateProject as _deactivateProject,
  deleteProject as _deleteProject,
  listProjectMembers as _listProjectMembers,
  addProjectMember as _addProjectMember,
  updateProjectMemberRole as _updateProjectMemberRole,
  removeProjectMember as _removeProjectMember,
} from '@ipm/shared';

export type { ProjectMemberRole, ProjectMemberDto, ProjectDto } from '@ipm/shared';

export const listProjects = () => _listProjects(api);
export const getProject = (id: number) => _getProject(api, id);
export const createProject = (data: { name: string; description?: string }) => _createProject(api, data);
export const updateProject = (id: number, data: { name?: string; description?: string }) => _updateProject(api, id, data);
export const activateProject = (id: number) => _activateProject(api, id);
export const deactivateProject = (id: number) => _deactivateProject(api, id);
export const deleteProject = (id: number) => _deleteProject(api, id);
export const listProjectMembers = (projectId: number) => _listProjectMembers(api, projectId);
export const addProjectMember = (id: number, data: { email: string; role?: import('@ipm/shared').ProjectMemberRole }) => _addProjectMember(api, id, data);
export const updateProjectMemberRole = (id: number, userId: number, role: import('@ipm/shared').ProjectMemberRole) => _updateProjectMemberRole(api, id, userId, role);
export const removeProjectMember = (id: number, userId: number) => _removeProjectMember(api, id, userId);
