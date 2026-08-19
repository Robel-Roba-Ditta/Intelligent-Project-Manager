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
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../../auth/application/jwt.strategy';
import { DependencyService } from '../../application/dependency.service';
import { CreateDependencyDto } from '../dto/create-dependency.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class DependencyController {
  constructor(private readonly dependencyService: DependencyService) {}

  @Post('tasks/:blockingTaskId/dependencies')
  create(
    @Param('blockingTaskId', ParseIntPipe) blockingTaskId: number,
    @Body() dto: CreateDependencyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.dependencyService.create(blockingTaskId, dto, user.sub);
  }

  @Get('tasks/:id/dependencies')
  findBlocksAndBlockedBy(@Param('id', ParseIntPipe) taskId: number) {
    return this.dependencyService.findBlocksAndBlockedBy(taskId);
  }

  @Delete('dependencies/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.dependencyService.remove(id, user.sub);
  }
}
