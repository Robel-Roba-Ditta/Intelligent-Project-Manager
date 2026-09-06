import { api } from '../../../common/lib/api';
import {
  listLabels as _listLabels,
  createLabel as _createLabel,
  updateLabel as _updateLabel,
  deleteLabel as _deleteLabel,
  attachLabel as _attachLabel,
  detachLabel as _detachLabel,
} from '@ipm/shared';
import type { CreateLabelData, UpdateLabelData } from '@ipm/shared';

export type { LabelDto, CreateLabelData, UpdateLabelData } from '@ipm/shared';

export const listLabels = (projectId: number) => _listLabels(api, projectId);
export const createLabel = (projectId: number, data: CreateLabelData) => _createLabel(api, projectId, data);
export const updateLabel = (id: number, data: UpdateLabelData) => _updateLabel(api, id, data);
export const deleteLabel = (id: number) => _deleteLabel(api, id);
export const attachLabel = (taskId: number, labelId: number) => _attachLabel(api, taskId, labelId);
export const detachLabel = (taskId: number, labelId: number) => _detachLabel(api, taskId, labelId);
