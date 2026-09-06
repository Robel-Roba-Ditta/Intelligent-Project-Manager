import { api } from '../../../common/lib/api';
import {
  listTimeLogs as _listTimeLogs,
  createTimeLog as _createTimeLog,
  deleteTimeLog as _deleteTimeLog,
} from '@ipm/shared';

export type { TimeLogDto, TimeLogsResponse } from '@ipm/shared';

export const listTimeLogs = (taskId: number) => _listTimeLogs(api, taskId);
export const createTimeLog = (taskId: number, data: { hours: number; date: string }) => _createTimeLog(api, taskId, data);
export const deleteTimeLog = (id: number) => _deleteTimeLog(api, id);
