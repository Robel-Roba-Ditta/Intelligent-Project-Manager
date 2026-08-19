import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface IErrorResponse {
  message: string;
  code?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request: any = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const { message, code } = this.extractError(exception);

    const responseData = {
      success: false,
      error: {
        code: code || this.getDefaultErrorCode(status),
        message,
      },
    };

    this.logMessage(request, message, status, exception);

    response.status(status).json(responseData);
  }

  /**
   * Normalize all exception types into unified structure
   */
  private extractError(exception: unknown): IErrorResponse {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();

      if (typeof res === 'string') {
        return { message: res };
      }

      if (typeof res === 'object' && res !== null) {
        const r = res as any;

        return {
          message:
            r.message instanceof Array
              ? r.message.join(', ')
              : r.message || 'Unexpected error',
          code: r.code || r.code_error,
        };
      }
    }

    if (exception instanceof Error) {
      return {
        message: exception.message || 'Internal server error',
      };
    }

    return {
      message: 'Internal server error',
    };
  }

  /**
   * Default error code mapping (important for consistency)
   */
  private getDefaultErrorCode(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'VALIDATION_ERROR';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }

  private logMessage(
    request: any,
    message: string,
    status: number,
    exception: any,
  ) {
    const baseLog = `method=${request.method} path=${request.url} status=${status} message=${message}`;

    if (status >= 500) {
      console.error(baseLog, exception?.stack);
    } else {
      console.warn(baseLog);
    }
  }
}
