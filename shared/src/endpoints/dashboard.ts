import type { AxiosInstance } from 'axios';
import type { DashboardData } from '../types/index.js';

export async function getDashboard(api: AxiosInstance): Promise<DashboardData> {
  const res = await api.get<DashboardData>('/dashboard');
  return res.data;
}
