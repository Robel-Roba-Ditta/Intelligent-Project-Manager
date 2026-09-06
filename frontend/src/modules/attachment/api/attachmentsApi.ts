import { api } from '../../../common/lib/api';
import {
  listAttachments as _listAttachments,
  createAttachment as _createAttachment,
  deleteAttachment as _deleteAttachment,
} from '@ipm/shared';

export type { AttachmentDto } from '@ipm/shared';

export const listAttachments = (taskId: number) => _listAttachments(api, taskId);
export const createAttachment = (taskId: number, data: { fileName: string; fileUrl: string }) => _createAttachment(api, taskId, data);
export const deleteAttachment = (id: number) => _deleteAttachment(api, id);
