import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../domain/comment.entity';
import { Task } from '../../task/domain/task.entity';
import { ProjectMember, ProjectRole } from '../../project/domain/project-member.entity';
import { CreateCommentDto } from '../api/dto/create-comment.dto';
import { UpdateCommentDto } from '../api/dto/update-comment.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TaskCommentPostedEvent } from '../../activity/domain/events';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
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

    const comment = this.commentRepo.create({
      taskId,
      authorId: userId,
      body: dto.body,
    });
    const saved = await this.commentRepo.save(comment);

    this.eventEmitter.emit(
      'task.comment_posted',
      new TaskCommentPostedEvent(taskId, userId, saved.id),
    );

    return this.commentRepo.findOneOrFail({
      where: { id: saved.id },
      relations: { author: true },
    });
  }

  async findAllByTask(taskId: number): Promise<Comment[]> {
    return this.commentRepo.find({
      where: { taskId },
      relations: { author: true },
      order: { createdAt: 'ASC' },
    });
  }

  async update(commentId: number, dto: UpdateCommentDto, userId: number): Promise<Comment> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: { author: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) {
      throw new ForbiddenException('Only the author can edit this comment');
    }
    comment.body = dto.body;
    await this.commentRepo.save(comment);
    return this.commentRepo.findOneOrFail({
      where: { id: commentId },
      relations: { author: true },
    });
  }

  async remove(commentId: number, userId: number): Promise<void> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    
    if (comment.authorId === userId) {
      await this.commentRepo.remove(comment);
      return;
    }

    
    const task = await this.getTaskOrFail(comment.taskId);
    const membership = await this.membersRepo.findOne({
      where: { projectId: task.projectId, userId },
    });
    if (!membership || (membership.role !== ProjectRole.OWNER && membership.role !== ProjectRole.ADMIN)) {
      throw new ForbiddenException('Only the author or a project admin can delete this comment');
    }
    await this.commentRepo.remove(comment);
  }
}
