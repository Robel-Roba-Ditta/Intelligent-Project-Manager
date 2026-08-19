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
import { AttachmentService } from '../../application/attachment.service';
import { CreateAttachmentDto } from '../dto/create-attachment.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Post('tasks/:taskId/attachments')
  create(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: CreateAttachmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.attachmentService.create(taskId, dto, user.sub);
  }

  @Get('tasks/:taskId/attachments')
  findAllByTask(@Param('taskId', ParseIntPipe) taskId: number) {
    return this.attachmentService.findAllByTask(taskId);
  }

  @Delete('attachments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.attachmentService.remove(id, user.sub);
  }
}
