import type { AxiosInstance } from 'axios';
import type { SearchResult } from '../types/index.js';

export async function searchGlobal(api: AxiosInstance, q: string): Promise<SearchResult> {
  const res = await api.get<SearchResult>('/search', { params: { q } });
  return res.data;
}
