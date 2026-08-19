import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TaskDependency } from '../domain/task-dependency.entity';
import { Task } from '../../task/domain/task.entity';
import { ProjectMember } from '../../project/domain/project-member.entity';
import { CreateDependencyDto } from '../api/dto/create-dependency.dto';
import { TaskDependencyAddedEvent } from '../../activity/domain/events';

@Injectable()
export class DependencyService {
  constructor(
    @InjectRepository(TaskDependency)
    private readonly depRepo: Repository<TaskDependency>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(ProjectMember)
    private readonly membersRepo: Repository<ProjectMember>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async getTaskOrFail(taskId: number): Promise<Task> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
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

  async create(
    blockingTaskId: number,
    dto: CreateDependencyDto,
    userId: number,
  ): Promise<TaskDependency> {
    const blockingTask = await this.getTaskOrFail(blockingTaskId);
    const blockedTask = await this.getTaskOrFail(dto.blockedTaskId);

    await this.assertMember(blockingTask.projectId, userId);

    // Validate: not self-referencing
    if (blockingTaskId === dto.blockedTaskId) {
      throw new BadRequestException('A task cannot depend on itself');
    }

    // Validate: same project
    if (blockingTask.projectId !== blockedTask.projectId) {
      throw new BadRequestException('Both tasks must belong to the same project');
    }

    // Validate: no direct reverse cycle
    const reverse = await this.depRepo.findOne({
      where: { blockingTaskId: dto.blockedTaskId, blockedTaskId: blockingTaskId },
    });
    if (reverse) {
      throw new BadRequestException(
        'Cannot create this dependency — the reverse relationship already exists (direct cycle)',
      );
    }

    // Check for duplicate
    const existing = await this.depRepo.findOne({
      where: { blockingTaskId, blockedTaskId: dto.blockedTaskId },
    });
    if (existing) {
      throw new BadRequestException('This dependency already exists');
    }

    const dep = this.depRepo.create({
      blockingTaskId,
      blockedTaskId: dto.blockedTaskId,
    });
    const saved = await this.depRepo.save(dep);

    this.eventEmitter.emit(
      'task.dependency_added',
      new TaskDependencyAddedEvent(blockingTaskId, userId, blockingTaskId, dto.blockedTaskId),
    );

    return this.depRepo.findOneOrFail({
      where: { id: saved.id },
      relations: { blockingTask: true, blockedTask: true },
    });
  }

  async findBlocksAndBlockedBy(taskId: number) {
    const blocks = await this.depRepo.find({
      where: { blockingTaskId: taskId },
      relations: { blockedTask: true },
      order: { createdAt: 'ASC' },
    });

    const blockedBy = await this.depRepo.find({
      where: { blockedTaskId: taskId },
      relations: { blockingTask: true },
      order: { createdAt: 'ASC' },
    });

    return {
      blocks: blocks.map((d) => ({
        dependencyId: d.id,
        task: { id: d.blockedTask.id, title: d.blockedTask.title, status: d.blockedTask.status },
      })),
      blockedBy: blockedBy.map((d) => ({
        dependencyId: d.id,
        task: { id: d.blockingTask.id, title: d.blockingTask.title, status: d.blockingTask.status },
      })),
    };
  }

  async remove(id: number, userId: number): Promise<void> {
    const dep = await this.depRepo.findOne({ where: { id } });
    if (!dep) throw new NotFoundException('Dependency not found');

    const task = await this.getTaskOrFail(dep.blockingTaskId);
    await this.assertMember(task.projectId, userId);

    await this.depRepo.remove(dep);
  }
}
