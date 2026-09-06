import { api } from '../../../common/lib/api';
import {
  watchTask as _watchTask,
  unwatchTask as _unwatchTask,
  getWatchStatus as _getWatchStatus,
} from '@ipm/shared';

export const watchTask = (taskId: number) => _watchTask(api, taskId);
export const unwatchTask = (taskId: number) => _unwatchTask(api, taskId);
export const getWatchStatus = (taskId: number) => _getWatchStatus(api, taskId);
