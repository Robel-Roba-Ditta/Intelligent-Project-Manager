import { Controller, VERSION_NEUTRAL } from '@nestjs/common';
import { PrometheusController } from '@willsoto/nestjs-prometheus';

@Controller({
  path: 'metrics',
  version: VERSION_NEUTRAL,
})
export class PrometheusMetricsController extends PrometheusController {}
