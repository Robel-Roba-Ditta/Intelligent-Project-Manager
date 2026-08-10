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
import { EpicsService } from './epics.service';
import { CreateEpicDto } from './dto/create-epic.dto';
import { UpdateEpicDto } from './dto/update-epic.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class EpicsController {
  constructor(private readonly epicsService: EpicsService) {}

  @Post('projects/:projectId/epics')
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateEpicDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.epicsService.create(projectId, dto, user.sub);
  }

  @Get('projects/:projectId/epics')
  findAllByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.epicsService.findAllByProject(projectId, user.sub);
  }

  @Get('epics/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.epicsService.findOne(id);
  }

  @Patch('epics/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEpicDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.epicsService.update(id, dto, user.sub);
  }

  @Delete('epics/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.epicsService.remove(id, user.sub);
  }
}
