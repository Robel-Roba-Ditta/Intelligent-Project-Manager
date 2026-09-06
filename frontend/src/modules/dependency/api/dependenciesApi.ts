import { api } from '../../../common/lib/api';
import {
  listDependencies as _listDependencies,
  createDependency as _createDependency,
  deleteDependency as _deleteDependency,
} from '@ipm/shared';

export type { DependencyTaskRef, DependenciesResponse } from '@ipm/shared';

export const listDependencies = (taskId: number) => _listDependencies(api, taskId);
export const createDependency = (blockingTaskId: number, blockedTaskId: number) => _createDependency(api, blockingTaskId, blockedTaskId);
export const deleteDependency = (id: number) => _deleteDependency(api, id);
