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
import { AttachmentsService } from './attachments.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('tasks/:taskId/attachments')
  create(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: CreateAttachmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.attachmentsService.create(taskId, dto, user.sub);
  }

  @Get('tasks/:taskId/attachments')
  findAllByTask(@Param('taskId', ParseIntPipe) taskId: number) {
    return this.attachmentsService.findAllByTask(taskId);
  }

  @Delete('attachments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.attachmentsService.remove(id, user.sub);
  }
}
