import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from './entities/attachment.entity';
import { Task } from '../tasks/entities/task.entity';
import { ProjectMember, ProjectRole } from '../projects/entities/project-member.entity';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TaskAttachmentAddedEvent } from '../activity/events';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentsRepo: Repository<Attachment>,
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,
    @InjectRepository(ProjectMember)
    private readonly membersRepo: Repository<ProjectMember>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async getTaskOrFail(taskId: number): Promise<Task> {
    const task = await this.tasksRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  private async assertMember(projectId: number, userId: number): Promise<void> {
    const membership = await this.membersRepo.findOne({
      where: { projectId, userId },
    });
    if (!membership) {
      throw new ForbiddenException('You must be a member of this project');
    }
  }

  async create(taskId: number, dto: CreateAttachmentDto, userId: number): Promise<Attachment> {
    const task = await this.getTaskOrFail(taskId);
    await this.assertMember(task.projectId, userId);

    const attachment = this.attachmentsRepo.create({
      taskId,
      fileName: dto.fileName,
      fileUrl: dto.fileUrl,
      addedById: userId,
    });
    const saved = await this.attachmentsRepo.save(attachment);

    this.eventEmitter.emit(
      'task.attachment_added',
      new TaskAttachmentAddedEvent(taskId, userId, saved.id, dto.fileName),
    );

    return this.attachmentsRepo.findOneOrFail({
      where: { id: saved.id },
      relations: { addedBy: true },
    });
  }

  async findAllByTask(taskId: number): Promise<Attachment[]> {
    return this.attachmentsRepo.find({
      where: { taskId },
      relations: { addedBy: true },
      order: { createdAt: 'ASC' },
    });
  }

  async remove(attachmentId: number, userId: number): Promise<void> {
    const attachment = await this.attachmentsRepo.findOne({
      where: { id: attachmentId },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');

    if (attachment.addedById === userId) {
      await this.attachmentsRepo.remove(attachment);
      return;
    }

    const task = await this.getTaskOrFail(attachment.taskId);
    const membership = await this.membersRepo.findOne({
      where: { projectId: task.projectId, userId },
    });
    if (!membership || (membership.role !== ProjectRole.OWNER && membership.role !== ProjectRole.ADMIN)) {
      throw new ForbiddenException('Only the uploader or a project admin can delete this attachment');
    }
    await this.attachmentsRepo.remove(attachment);
  }
}
