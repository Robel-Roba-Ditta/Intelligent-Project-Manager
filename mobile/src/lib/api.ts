import { createApiClient } from '@ipm/shared';
import { getToken } from './authStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

export const api = createApiClient({
  baseURL: API_URL,
  getToken,
});
