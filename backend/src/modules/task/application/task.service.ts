import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Task, TaskStatus } from '../domain/task.entity';
import { Epic } from '../../epic/domain/epic.entity';
import { Sprint, SprintStatus } from '../../sprint/domain/sprint.entity';
import { ActivityLog } from '../../activity/domain/activity-log.entity';
import { ProjectMember, ProjectRole } from '../../project/domain/project-member.entity';
import { UserRole } from '../../user/domain/user.entity';
import { ProjectService } from '../../project/application/project.service';
import { UserService } from '../../user/application/user.service';
import { CreateTaskDto } from '../api/dto/create-task.dto';
import { UpdateTaskDto } from '../api/dto/update-task.dto';
import { TaskStatusChangedEvent, TaskAssigneeChangedEvent } from '../../activity/domain/events';

const TASK_RELATIONS = {
  project: true,
  epic: true,
  sprint: true,
  assignee: true,
  parent: true,
  children: true,
  labels: true,
  createdBy: true,
};

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Epic)
    private readonly epicsRepository: Repository<Epic>,
    @InjectRepository(Sprint)
    private readonly sprintsRepository: Repository<Sprint>,
    @InjectRepository(ProjectMember)
    private readonly membersRepository: Repository<ProjectMember>,
    private readonly projectService: ProjectService,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async assertMember(projectId: number, userId: number) {
    const project = await this.projectService.findOne(projectId);
    const isMember = project.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You must be a member of this project');
    }
    return project;
  }

  
  private async validateAssignee(assigneeId: number, projectId: number): Promise<void> {
    const membership = await this.membersRepository.findOne({
      where: { userId: assigneeId, projectId },
    });
    if (!membership) {
      throw new BadRequestException(
        'The assignee must be a member of this project',
      );
    }
  }

  
  private async validateEpic(epicId: number, projectId: number): Promise<void> {
    const epic = await this.epicsRepository.findOne({ where: { id: epicId } });
    if (!epic) throw new NotFoundException('Epic not found');
    if (epic.projectId !== projectId) {
      throw new BadRequestException(
        'The epic must belong to the same project as the task',
      );
    }
  }

  
  private async validateSprint(sprintId: number, projectId: number): Promise<void> {
    const sprint = await this.sprintsRepository.findOne({ where: { id: sprintId } });
    if (!sprint) throw new NotFoundException('Sprint not found');
    if (sprint.projectId !== projectId) {
      throw new BadRequestException(
        'The sprint must belong to the same project as the task',
      );
    }
  }

  
  private async validateRelations(
    projectId: number,
    assigneeId?: number | null,
    epicId?: number | null,
    sprintId?: number | null,
  ): Promise<void> {
    if (assigneeId) await this.validateAssignee(assigneeId, projectId);
    if (epicId) await this.validateEpic(epicId, projectId);
    if (sprintId) await this.validateSprint(sprintId, projectId);
  }

  async create(projectId: number, dto: CreateTaskDto, userId: number): Promise<Task> {
    await this.assertMember(projectId, userId);
    await this.validateRelations(projectId, dto.assigneeId, dto.epicId, dto.sprintId);

    
    if (dto.parentTaskId) {
      const parent = await this.taskRepository.findOne({ where: { id: dto.parentTaskId } });
      if (!parent) throw new NotFoundException('Parent task not found');
      if (parent.projectId !== projectId) {
        throw new BadRequestException('Parent task must belong to the same project');
      }
      if (parent.parentTaskId) {
        throw new BadRequestException('A subtask cannot have its own subtasks (max nesting depth is 1)');
      }
    }

    const task = this.taskRepository.create({
      title: dto.title,
      description: dto.description ?? null,
      status: dto.status,
      priority: dto.priority,
      type: dto.type,
      storyPoints: dto.storyPoints ?? null,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      projectId,
      epicId: dto.epicId ?? null,
      sprintId: dto.sprintId ?? null,
      assigneeId: dto.assigneeId ?? null,
      parentTaskId: dto.parentTaskId ?? null,
      createdById: userId,
    });

    const saved = await this.taskRepository.save(task);

    if (dto.assigneeId) {
      this.eventEmitter.emit(
        'task.assignee_changed',
        new TaskAssigneeChangedEvent(saved.id, userId, null, dto.assigneeId),
      );
    }

    return this.findOne(saved.id);
  }

  async findAllByProject(
    projectId: number,
    userId: number,
    filters?: {
      assigneeId?: number;
      sprintId?: number;
      epicId?: number;
      status?: string;
      priority?: string;
      search?: string;
    },
  ): Promise<Task[]> {
    await this.assertMember(projectId, userId);

    const qb = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.epic', 'epic')
      .leftJoinAndSelect('task.sprint', 'sprint')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.parent', 'parent')
      .leftJoinAndSelect('task.children', 'children')
      .leftJoinAndSelect('task.labels', 'labels')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .where('task.projectId = :projectId', { projectId })
      .andWhere('task.isDeleted = false');

    if (filters?.assigneeId) qb.andWhere('task.assigneeId = :assigneeId', { assigneeId: filters.assigneeId });
    if (filters?.sprintId) qb.andWhere('task.sprintId = :sprintId', { sprintId: filters.sprintId });
    if (filters?.epicId) qb.andWhere('task.epicId = :epicId', { epicId: filters.epicId });
    if (filters?.status) qb.andWhere('task.status = :status', { status: filters.status });
    if (filters?.priority) qb.andWhere('task.priority = :priority', { priority: filters.priority });
    if (filters?.search) {
      qb.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    qb.orderBy('task.createdAt', 'DESC');

    return qb.getMany();
  }

  async findAllForUser(userId: number): Promise<Task[]> {
    return this.taskRepository.find({
      where: { assigneeId: userId, isDeleted: false },
      relations: TASK_RELATIONS,
      order: { dueDate: 'ASC', createdAt: 'DESC' }, 
    });
  }

  async findOne(id: number): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: TASK_RELATIONS,
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(id: number, dto: UpdateTaskDto, userId: number): Promise<Task> {
    const task = await this.findOne(id);
    await this.assertMember(task.projectId, userId);
    await this.validateRelations(
      task.projectId,
      dto.assigneeId !== undefined ? dto.assigneeId : undefined,
      dto.epicId !== undefined ? dto.epicId : undefined,
      dto.sprintId !== undefined ? dto.sprintId : undefined,
    );

    
    const oldAssigneeId = task.assigneeId;

    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description ?? null;
    if (dto.priority !== undefined) task.priority = dto.priority;
    if (dto.type !== undefined) task.type = dto.type;
    if (dto.storyPoints !== undefined) task.storyPoints = dto.storyPoints ?? null;
    if (dto.dueDate !== undefined) task.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    
    if (dto.epicId !== undefined) { task.epicId = dto.epicId; task.epic = undefined as any; }
    if (dto.sprintId !== undefined) { task.sprintId = dto.sprintId; task.sprint = undefined as any; }
    if (dto.assigneeId !== undefined) { task.assigneeId = dto.assigneeId; task.assignee = undefined as any; }
    if (dto.parentTaskId !== undefined) { task.parentTaskId = dto.parentTaskId; task.parent = undefined as any; }

    await this.taskRepository.save(task);

    
    if (dto.assigneeId !== undefined && dto.assigneeId !== oldAssigneeId) {
      this.eventEmitter.emit(
        'task.assignee_changed',
        new TaskAssigneeChangedEvent(id, userId, oldAssigneeId, dto.assigneeId),
      );
    }

    return this.findOne(id);
  }

  
  async remove(id: number, userId: number): Promise<Task> {
    const task = await this.findOne(id);
    const project = await this.projectService.findOne(task.projectId);

    
    const currentUser = await this.userService.findById(userId);
    const isCreator = task.createdById === userId;
    const membership = project.members.find((m) => m.userId === userId);
    const isProjectAdmin = membership?.role === ProjectRole.OWNER || membership?.role === ProjectRole.ADMIN;
    const isSiteAdmin = currentUser?.role === UserRole.ADMIN;

    if (!isCreator && !isProjectAdmin && !isSiteAdmin) {
      throw new ForbiddenException(
        'Only the task creator or a project admin can delete a task',
      );
    }

    task.isDeleted = true;
    await this.taskRepository.save(task);
    return this.findOne(id);
  }

  

  private static readonly TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
    [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS],
    [TaskStatus.IN_PROGRESS]: [TaskStatus.IN_REVIEW, TaskStatus.TODO],
    [TaskStatus.IN_REVIEW]: [TaskStatus.DONE, TaskStatus.IN_PROGRESS],
    [TaskStatus.DONE]: [TaskStatus.IN_REVIEW],
  };

  async changeStatus(id: number, newStatus: TaskStatus, userId: number): Promise<Task> {
    const task = await this.findOne(id);
    await this.assertMember(task.projectId, userId);

    
    if (task.status === newStatus) {
      return task;
    }

    const allowed = TaskService.TRANSITIONS[task.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot move from ${task.status} to ${newStatus}`,
      );
    }

    const fromStatus = task.status;
    task.status = newStatus;

    
    if (newStatus === TaskStatus.DONE) {
      task.completedAt = new Date();
    } else if (task.completedAt) {
      task.completedAt = null;
    }

    await this.taskRepository.save(task);

    
    this.eventEmitter.emit(
      'task.status_changed',
      new TaskStatusChangedEvent(id, userId, fromStatus, newStatus),
    );

    return this.findOne(id);
  }
}
