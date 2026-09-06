import axios, { type AxiosInstance } from 'axios';

export function createApiClient(config: {
  baseURL: string;
  getToken: () => string | null | Promise<string | null>;
}): AxiosInstance {
  const instance = axios.create({
    baseURL: config.baseURL,
  });

  instance.interceptors.request.use(async (reqConfig) => {
    const token = await config.getToken();
    if (token) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }
    return reqConfig;
  });

  return instance;
}

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[] } | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message[0] : data.message;
    }
    if (err.code === 'ERR_NETWORK') {
      return 'Could not reach the server. Is the backend running?';
    }
  }
  return 'Something went wrong. Please try again.';
}
