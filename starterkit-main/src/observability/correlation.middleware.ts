import { v4 as uuid } from 'uuid';

export function correlationMiddleware(req, res, next) {
  const correlationId = req.headers['x-correlation-id'] || uuid();

  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);

  next();
}
