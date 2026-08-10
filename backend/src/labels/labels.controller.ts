import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { AttachLabelDto } from './dto/attach-label.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  // ─── Project-scoped label CRUD ──────────────────────────────

  @Post('projects/:projectId/labels')
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateLabelDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.labelsService.create(projectId, dto, user.sub);
  }

  @Get('projects/:projectId/labels')
  findAllByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.labelsService.findAllByProject(projectId, user.sub);
  }

  @Patch('labels/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLabelDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.labelsService.update(id, dto, user.sub);
  }

  @Delete('labels/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.labelsService.remove(id, user.sub);
  }

  // ─── Task label attach/detach ──────────────────────────────

  @Post('tasks/:id/labels')
  attachLabel(
    @Param('id', ParseIntPipe) taskId: number,
    @Body() dto: AttachLabelDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.labelsService.attachLabel(taskId, dto.labelId, user.sub);
  }

  @Delete('tasks/:id/labels/:labelId')
  detachLabel(
    @Param('id', ParseIntPipe) taskId: number,
    @Param('labelId', ParseIntPipe) labelId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.labelsService.detachLabel(taskId, labelId, user.sub);
  }
}
