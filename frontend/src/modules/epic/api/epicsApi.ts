import { api } from '../../../common/lib/api';
import {
  listEpics as _listEpics,
  getEpic as _getEpic,
  createEpic as _createEpic,
  updateEpic as _updateEpic,
  deleteEpic as _deleteEpic,
} from '@ipm/shared';
import type { EpicStatus } from '@ipm/shared';

export type { EpicStatus, EpicDto } from '@ipm/shared';

export const listEpics = (projectId: number) => _listEpics(api, projectId);
export const getEpic = (id: number) => _getEpic(api, id);
export const createEpic = (projectId: number, data: { name: string; description?: string; status?: EpicStatus }) => _createEpic(api, projectId, data);
export const updateEpic = (id: number, data: { name?: string; description?: string; status?: EpicStatus }) => _updateEpic(api, id, data);
export const deleteEpic = (id: number) => _deleteEpic(api, id);
