import { api } from '../../../common/lib/api';
import {
  listSprints as _listSprints,
  getMyActiveSprints as _getMyActiveSprints,
  getSprint as _getSprint,
  createSprint as _createSprint,
  updateSprint as _updateSprint,
  deleteSprint as _deleteSprint,
  startSprint as _startSprint,
  completeSprint as _completeSprint,
  getSprintBurndown as _getSprintBurndown,
} from '@ipm/shared';

export type { SprintStatus, SprintDto, BurndownDay, BurndownData } from '@ipm/shared';

export const listSprints = (projectId: number) => _listSprints(api, projectId);
export const getMyActiveSprints = () => _getMyActiveSprints(api);
export const getSprint = (id: number) => _getSprint(api, id);
export const createSprint = (projectId: number, data: { name: string; goal?: string }) => _createSprint(api, projectId, data);
export const updateSprint = (id: number, data: { name?: string; goal?: string }) => _updateSprint(api, id, data);
export const deleteSprint = (id: number) => _deleteSprint(api, id);
export const startSprint = (id: number) => _startSprint(api, id);
export const completeSprint = (id: number) => _completeSprint(api, id);
export const getSprintBurndown = (id: number) => _getSprintBurndown(api, id);
