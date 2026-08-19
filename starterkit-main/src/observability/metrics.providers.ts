import { makeCounterProvider } from '@willsoto/nestjs-prometheus';

export const metricsProviders = [
  makeCounterProvider({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
  }),
];
