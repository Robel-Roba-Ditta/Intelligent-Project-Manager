import { api } from '../../../common/lib/api';
import { searchGlobal as _searchGlobal } from '@ipm/shared';

export type { SearchResult } from '@ipm/shared';

export const searchGlobal = (q: string) => _searchGlobal(api, q);
