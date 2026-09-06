import { api } from '../../../common/lib/api';
import {
  listTasks as _listTasks,
  getMyTasks as _getMyTasks,
  getTask as _getTask,
  createTask as _createTask,
  updateTask as _updateTask,
  deleteTask as _deleteTask,
  changeTaskStatus as _changeTaskStatus,
} from '@ipm/shared';
import type { TaskFilters, CreateTaskData, UpdateTaskData, TaskStatus } from '@ipm/shared';

export type { TaskStatus, TaskPriority, TaskType, TaskDto, CreateTaskData, UpdateTaskData, TaskFilters } from '@ipm/shared';

export const listTasks = (projectId: number, filters?: TaskFilters) => _listTasks(api, projectId, filters);
export const getMyTasks = () => _getMyTasks(api);
export const getTask = (id: number) => _getTask(api, id);
export const createTask = (projectId: number, data: CreateTaskData) => _createTask(api, projectId, data);
export const updateTask = (id: number, data: UpdateTaskData) => _updateTask(api, id, data);
export const deleteTask = (id: number) => _deleteTask(api, id);
export const changeTaskStatus = (id: number, status: TaskStatus) => _changeTaskStatus(api, id, status);
