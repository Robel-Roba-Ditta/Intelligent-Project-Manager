import { api } from '../../../common/lib/api';
import { listActivity as _listActivity } from '@ipm/shared';

export type { ActivityLogDto } from '@ipm/shared';

export const listActivity = (taskId: number) => _listActivity(api, taskId);
