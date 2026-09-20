import { api } from '../../../common/lib/api';
import { listUsers as _listUsers, setUserActive as _setUserActive } from '@ipm/shared';

export type { UserDto } from '@ipm/shared';

export const listUsers = () => _listUsers(api);
export const setUserActive = (userId: number, isActive: boolean) => _setUserActive(api, userId, isActive);
