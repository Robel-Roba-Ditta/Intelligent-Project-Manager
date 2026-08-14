import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Task } from '../tasks/entities/task.entity';
import { ProjectMember, ProjectRole } from '../projects/entities/project-member.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TaskCommentPostedEvent } from '../activity/events';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepo: Repository<Comment>,
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

  private async assertMember(projectId: number, userId: number): Promise<ProjectMember | undefined> {
    const membership = await this.membersRepo.findOne({
      where: { projectId, userId },
    });
    if (!membership) {
      throw new ForbiddenException('You must be a member of this project');
    }
    return membership;
  }

  async create(taskId: number, dto: CreateCommentDto, userId: number): Promise<Comment> {
    const task = await this.getTaskOrFail(taskId);
    await this.assertMember(task.projectId, userId);

    const comment = this.commentsRepo.create({
      taskId,
      authorId: userId,
      body: dto.body,
    });
    const saved = await this.commentsRepo.save(comment);

    this.eventEmitter.emit(
      'task.comment_posted',
      new TaskCommentPostedEvent(taskId, userId, saved.id),
    );

    return this.commentsRepo.findOneOrFail({
      where: { id: saved.id },
      relations: { author: true },
    });
  }

  async findAllByTask(taskId: number): Promise<Comment[]> {
    return this.commentsRepo.find({
      where: { taskId },
      relations: { author: true },
      order: { createdAt: 'ASC' },
    });
  }

  async update(commentId: number, dto: UpdateCommentDto, userId: number): Promise<Comment> {
    const comment = await this.commentsRepo.findOne({
      where: { id: commentId },
      relations: { author: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) {
      throw new ForbiddenException('Only the author can edit this comment');
    }
    comment.body = dto.body;
    await this.commentsRepo.save(comment);
    return this.commentsRepo.findOneOrFail({
      where: { id: commentId },
      relations: { author: true },
    });
  }

  async remove(commentId: number, userId: number): Promise<void> {
    const comment = await this.commentsRepo.findOne({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    // Author can always delete their own comment
    if (comment.authorId === userId) {
      await this.commentsRepo.remove(comment);
      return;
    }

    // Otherwise, must be admin/owner on the project
    const task = await this.getTaskOrFail(comment.taskId);
    const membership = await this.membersRepo.findOne({
      where: { projectId: task.projectId, userId },
    });
    if (!membership || (membership.role !== ProjectRole.OWNER && membership.role !== ProjectRole.ADMIN)) {
      throw new ForbiddenException('Only the author or a project admin can delete this comment');
    }
    await this.commentsRepo.remove(comment);
  }
}
