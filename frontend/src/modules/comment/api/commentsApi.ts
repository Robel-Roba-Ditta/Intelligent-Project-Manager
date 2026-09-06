import { api } from '../../../common/lib/api';
import {
  listComments as _listComments,
  createComment as _createComment,
  updateComment as _updateComment,
  deleteComment as _deleteComment,
} from '@ipm/shared';

export type { CommentDto } from '@ipm/shared';

export const listComments = (taskId: number) => _listComments(api, taskId);
export const createComment = (taskId: number, body: string) => _createComment(api, taskId, body);
export const updateComment = (id: number, body: string) => _updateComment(api, id, body);
export const deleteComment = (id: number) => _deleteComment(api, id);
