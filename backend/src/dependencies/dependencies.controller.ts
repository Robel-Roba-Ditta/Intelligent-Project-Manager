import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { DependenciesService } from './dependencies.service';
import { CreateDependencyDto } from './dto/create-dependency.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class DependenciesController {
  constructor(private readonly dependenciesService: DependenciesService) {}

  @Post('tasks/:blockingTaskId/dependencies')
  create(
    @Param('blockingTaskId', ParseIntPipe) blockingTaskId: number,
    @Body() dto: CreateDependencyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.dependenciesService.create(blockingTaskId, dto, user.sub);
  }

  @Get('tasks/:id/dependencies')
  findBlocksAndBlockedBy(@Param('id', ParseIntPipe) taskId: number) {
    return this.dependenciesService.findBlocksAndBlockedBy(taskId);
  }

  @Delete('dependencies/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.dependenciesService.remove(id, user.sub);
  }
}
