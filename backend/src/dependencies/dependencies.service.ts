import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TaskDependency } from './entities/task-dependency.entity';
import { Task } from '../tasks/entities/task.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { CreateDependencyDto } from './dto/create-dependency.dto';
import { TaskDependencyAddedEvent } from '../activity/events';

@Injectable()
export class DependenciesService {
  constructor(
    @InjectRepository(TaskDependency)
    private readonly depsRepo: Repository<TaskDependency>,
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
    const reverse = await this.depsRepo.findOne({
      where: { blockingTaskId: dto.blockedTaskId, blockedTaskId: blockingTaskId },
    });
    if (reverse) {
      throw new BadRequestException(
        'Cannot create this dependency — the reverse relationship already exists (direct cycle)',
      );
    }

    // Check for duplicate
    const existing = await this.depsRepo.findOne({
      where: { blockingTaskId, blockedTaskId: dto.blockedTaskId },
    });
    if (existing) {
      throw new BadRequestException('This dependency already exists');
    }

    const dep = this.depsRepo.create({
      blockingTaskId,
      blockedTaskId: dto.blockedTaskId,
    });
    const saved = await this.depsRepo.save(dep);

    this.eventEmitter.emit(
      'task.dependency_added',
      new TaskDependencyAddedEvent(blockingTaskId, userId, blockingTaskId, dto.blockedTaskId),
    );

    return this.depsRepo.findOneOrFail({
      where: { id: saved.id },
      relations: { blockingTask: true, blockedTask: true },
    });
  }

  async findBlocksAndBlockedBy(taskId: number) {
    const blocks = await this.depsRepo.find({
      where: { blockingTaskId: taskId },
      relations: { blockedTask: true },
      order: { createdAt: 'ASC' },
    });

    const blockedBy = await this.depsRepo.find({
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
    const dep = await this.depsRepo.findOne({ where: { id } });
    if (!dep) throw new NotFoundException('Dependency not found');

    const task = await this.getTaskOrFail(dep.blockingTaskId);
    await this.assertMember(task.projectId, userId);

    await this.depsRepo.remove(dep);
  }
}
