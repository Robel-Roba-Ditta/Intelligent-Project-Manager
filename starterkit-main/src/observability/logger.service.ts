import { Injectable } from '@nestjs/common';

@Injectable()
export class AppLogger {

  private format(
    level: string,
    service: string,
    message: string,
    correlationId: string,
    metadata?: any,
  ) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      service,
      message,
      correlationId,
      metadata: metadata || {},
    });
  }

  log(service: string, message: string, correlationId: string, metadata?: any) {
    console.log(
      this.format('info', service, message, correlationId, metadata),
    );
  }

  warn(
    service: string,
    message: string,
    correlationId: string,
    metadata?: any,
  ) {
    console.warn(
      this.format('warn', service, message, correlationId, metadata),
    );
  }

  error(
    service: string,
    message: string,
    correlationId: string,
    metadata?: any,
  ) {
    console.error(
      this.format('error', service, message, correlationId, metadata),
    );
  }
}
