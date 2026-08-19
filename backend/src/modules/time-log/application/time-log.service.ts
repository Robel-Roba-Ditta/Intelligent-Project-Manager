import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TimeLog } from '../domain/time-log.entity';
import { Task } from '../../task/domain/task.entity';
import { ProjectMember, ProjectRole } from '../../project/domain/project-member.entity';
import { CreateTimeLogDto } from '../api/dto/create-time-log.dto';
import { TaskTimeLoggedEvent } from '../../activity/domain/events';

@Injectable()
export class TimeLogService {
  constructor(
    @InjectRepository(TimeLog)
    private readonly timeLogRepo: Repository<TimeLog>,
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

  async create(taskId: number, dto: CreateTimeLogDto, userId: number): Promise<TimeLog> {
    const task = await this.getTaskOrFail(taskId);
    await this.assertMember(task.projectId, userId);

    const entry = this.timeLogRepo.create({
      taskId,
      userId,
      hours: dto.hours,
      date: dto.date,
    });
    const saved = await this.timeLogRepo.save(entry);

    this.eventEmitter.emit(
      'task.time_logged',
      new TaskTimeLoggedEvent(taskId, userId, dto.hours, dto.date),
    );

    return this.timeLogRepo.findOneOrFail({
      where: { id: saved.id },
      relations: { user: true },
    });
  }

  async findAllByTask(taskId: number): Promise<{ entries: TimeLog[]; totalHours: number }> {
    const entries = await this.timeLogRepo.find({
      where: { taskId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });

    const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);

    return { entries, totalHours };
  }

  async remove(id: number, userId: number): Promise<void> {
    const entry = await this.timeLogRepo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Time log not found');

    if (entry.userId === userId) {
      await this.timeLogRepo.remove(entry);
      return;
    }

    const task = await this.getTaskOrFail(entry.taskId);
    const membership = await this.membersRepo.findOne({
      where: { projectId: task.projectId, userId },
    });
    if (!membership || (membership.role !== ProjectRole.OWNER && membership.role !== ProjectRole.ADMIN)) {
      throw new ForbiddenException('Only the logger or a project admin can delete this entry');
    }
    await this.timeLogRepo.remove(entry);
  }
}
