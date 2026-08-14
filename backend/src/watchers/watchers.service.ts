import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Watcher } from './entities/watcher.entity';
import { Task } from '../tasks/entities/task.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TaskWatcherToggledEvent } from '../activity/events';

@Injectable()
export class WatchersService {
  constructor(
    @InjectRepository(Watcher)
    private readonly watchersRepo: Repository<Watcher>,
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

  async watch(taskId: number, userId: number): Promise<{ watching: boolean }> {
    const task = await this.getTaskOrFail(taskId);
    await this.assertMember(task.projectId, userId);

    const existing = await this.watchersRepo.findOne({
      where: { taskId, userId },
    });
    if (!existing) {
      const watcher = this.watchersRepo.create({ taskId, userId });
      await this.watchersRepo.save(watcher);
    }

    this.eventEmitter.emit(
      'task.watcher_toggled',
      new TaskWatcherToggledEvent(taskId, userId, true),
    );

    return { watching: true };
  }

  async unwatch(taskId: number, userId: number): Promise<{ watching: boolean }> {
    const existing = await this.watchersRepo.findOne({
      where: { taskId, userId },
    });
    if (existing) {
      await this.watchersRepo.remove(existing);
    }

    this.eventEmitter.emit(
      'task.watcher_toggled',
      new TaskWatcherToggledEvent(taskId, userId, false),
    );

    return { watching: false };
  }

  async isWatching(taskId: number, userId: number): Promise<{ watching: boolean }> {
    const watcher = await this.watchersRepo.findOne({
      where: { taskId, userId },
    });
    return { watching: !!watcher };
  }
}
