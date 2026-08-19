import { api } from '../../../common/lib/api';

export interface SearchResult {
  projects: { id: number; name: string }[];
  tasks: { id: number; title: string; projectName: string; status: string }[];
}

export async function searchGlobal(q: string): Promise<SearchResult> {
  const res = await api.get<SearchResult>('/search', { params: { q } });
  return res.data;
}
