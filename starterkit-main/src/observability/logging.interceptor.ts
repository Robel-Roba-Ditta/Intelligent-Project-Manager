import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;

        console.log(
          JSON.stringify({
            level: 'info',
            type: 'http',
            method: req.method,
            url: req.url,
            status: req.statusCode,
            duration,
            correlationId: req.correlationId,
          }),
        );
      }),
    );
  }
}
