import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './logging.interceptor';
import { metricsProviders } from './metrics.providers';
import { AppLogger } from './logger.service';

@Module({
  providers: [
    ...metricsProviders,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    AppLogger,
  ],
  exports: [AppLogger],
})
export class ObservabilityModule {}
