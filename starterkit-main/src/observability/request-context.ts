import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestStore {
  correlationId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestStore>();

export function runWithContext(req: any, fn: () => void) {
  requestContext.run(
    {
      correlationId: req.correlationId,
    },
    fn,
  );
}

export function getCorrelationId() {
  return requestContext.getStore()?.correlationId;
}
