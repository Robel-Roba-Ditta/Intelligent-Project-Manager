import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sprint, SprintStatus } from '../domain/sprint.entity';
import { Task } from '../../../modules/task/domain/task.entity';
import { ActivityLog } from '../../activity/domain/activity-log.entity';
import { ProjectService } from '../../project/application/project.service';
import { CreateSprintDto } from '../api/dto/create-sprint.dto';
import { UpdateSprintDto } from '../api/dto/update-sprint.dto';

@Injectable()
export class SprintService {
  constructor(
    @InjectRepository(Sprint)
    private readonly sprintRepository: Repository<Sprint>,
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(ActivityLog)
    private readonly activityRepository: Repository<ActivityLog>,
    private readonly projectService: ProjectService,
  ) {}

  private async assertMember(projectId: number, userId: number) {
    const project = await this.projectService.findOne(projectId);
    const isMember = project.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You must be a member of this project');
    }
    return project;
  }

  async create(projectId: number, dto: CreateSprintDto, userId: number): Promise<Sprint> {
    await this.assertMember(projectId, userId);

    const sprint = this.sprintRepository.create({
      name: dto.name,
      goal: dto.goal ?? null,
      projectId,
    });
    const saved = await this.sprintRepository.save(sprint);
    return this.findOne(saved.id);
  }

  async findAllByProject(projectId: number, userId: number): Promise<Sprint[]> {
    await this.assertMember(projectId, userId);

    return this.sprintRepository.find({
      where: { projectId },
      relations: { project: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveForUser(userId: number): Promise<Sprint[]> {
    return this.sprintRepository.find({
      where: {
        status: SprintStatus.ACTIVE,
        project: { members: { userId } },
      },
      relations: { project: true },
      order: { endDate: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Sprint> {
    const sprint = await this.sprintRepository.findOne({
      where: { id },
      relations: { project: true },
    });
    if (!sprint) throw new NotFoundException('Sprint not found');
    return sprint;
  }

  async update(id: number, dto: UpdateSprintDto, userId: number): Promise<Sprint> {
    const sprint = await this.findOne(id);
    await this.assertMember(sprint.projectId, userId);

    if (dto.name !== undefined) sprint.name = dto.name;
    if (dto.goal !== undefined) sprint.goal = dto.goal;
    await this.sprintRepository.save(sprint);

    return this.findOne(id);
  }

  async remove(id: number, userId: number): Promise<void> {
    const sprint = await this.findOne(id);
    await this.assertMember(sprint.projectId, userId);
    await this.sprintRepository.remove(sprint);
  }

  

  
  async start(id: number, userId: number): Promise<Sprint> {
    const sprint = await this.findOne(id);
    await this.assertMember(sprint.projectId, userId);

    if (sprint.status !== SprintStatus.PLANNED) {
      throw new BadRequestException(
        `Cannot start a sprint that is ${sprint.status.toLowerCase()}. Only PLANNED sprints can be started.`,
      );
    }

    
    const existingActive = await this.sprintRepository.findOne({
      where: { projectId: sprint.projectId, status: SprintStatus.ACTIVE },
    });
    if (existingActive) {
      throw new BadRequestException(
        'Complete the active sprint first',
      );
    }

    sprint.status = SprintStatus.ACTIVE;
    sprint.startDate = new Date();
    await this.sprintRepository.save(sprint);
    return this.findOne(id);
  }

  
  async complete(id: number, userId: number): Promise<Sprint> {
    const sprint = await this.findOne(id);
    await this.assertMember(sprint.projectId, userId);

    if (sprint.status !== SprintStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot complete a sprint that is ${sprint.status.toLowerCase()}. Only ACTIVE sprints can be completed.`,
      );
    }

    sprint.status = SprintStatus.COMPLETED;
    sprint.endDate = new Date();
    await this.sprintRepository.save(sprint);
    return this.findOne(id);
  }

  

  async getBurndown(id: number) {
    const sprint = await this.findOne(id);

    if (!sprint.startDate) {
      throw new BadRequestException('Sprint has not been started yet');
    }

    const totalTasks = await this.tasksRepository.count({
      where: { sprintId: id, isDeleted: false },
    });

    const startDate = new Date(sprint.startDate);
    
    const endDate = sprint.endDate ? new Date(sprint.endDate) : new Date();
    const lastDay = sprint.endDate ? endDate : new Date(); 

    
    const doneEvents = await this.activityRepository
      .createQueryBuilder('al')
      .innerJoin('al.task', 'task')
      .where('task.sprintId = :sprintId', { sprintId: id })
      .andWhere('task.isDeleted = false')
      .andWhere('al.action = :action', { action: 'status_changed' })
      .andWhere("al.details->>'toStatus' = :toStatus", { toStatus: 'DONE' })
      .select(['al.createdAt'])
      .orderBy('al.createdAt', 'ASC')
      .getMany();

    
    const completionsByDate = new Map<string, number>();
    for (const event of doneEvents) {
      const dateKey = new Date(event.createdAt).toISOString().split('T')[0];
      completionsByDate.set(dateKey, (completionsByDate.get(dateKey) || 0) + 1);
    }

    
    const sprintEndForIdeal = sprint.endDate ? new Date(sprint.endDate) : endDate;
    const totalDays = Math.max(
      1,
      Math.ceil((sprintEndForIdeal.getTime() - startDate.getTime()) / 86_400_000),
    );

    
    const days: { date: string; idealRemaining: number; actualRemaining: number }[] = [];
    let cumulativeCompleted = 0;

    const current = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const lastDayNorm = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate());
    let dayIndex = 0;

    while (current <= lastDayNorm) {
      const dateKey = current.toISOString().split('T')[0];
      cumulativeCompleted += completionsByDate.get(dateKey) || 0;

      const idealRemaining = Math.max(
        0,
        Number((totalTasks - (totalTasks * dayIndex) / totalDays).toFixed(1)),
      );

      days.push({
        date: dateKey,
        idealRemaining,
        actualRemaining: totalTasks - cumulativeCompleted,
      });

      current.setDate(current.getDate() + 1);
      dayIndex++;
    }

    return {
      sprintName: sprint.name,
      startDate: startDate.toISOString().split('T')[0],
      endDate: sprintEndForIdeal.toISOString().split('T')[0],
      totalTasks,
      days,
    };
  }
}
