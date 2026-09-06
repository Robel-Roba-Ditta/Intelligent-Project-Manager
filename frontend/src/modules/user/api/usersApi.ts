import { api } from '../../../common/lib/api';
import { listUsers as _listUsers } from '@ipm/shared';

export type { UserDto } from '@ipm/shared';

export const listUsers = () => _listUsers(api);
