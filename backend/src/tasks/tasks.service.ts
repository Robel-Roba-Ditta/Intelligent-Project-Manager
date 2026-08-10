import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { Epic } from '../epics/entities/epic.entity';
import { Sprint } from '../sprints/entities/sprint.entity';
import { ProjectMember, ProjectRole } from '../projects/entities/project-member.entity';
import { UserRole } from '../users/entities/user.entity';
import { ProjectsService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

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
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(Epic)
    private readonly epicsRepository: Repository<Epic>,
    @InjectRepository(Sprint)
    private readonly sprintsRepository: Repository<Sprint>,
    @InjectRepository(ProjectMember)
    private readonly membersRepository: Repository<ProjectMember>,
    private readonly projectsService: ProjectsService,
    private readonly usersService: UsersService,
  ) {}

  private async assertMember(projectId: number, userId: number) {
    const project = await this.projectsService.findOne(projectId);
    const isMember = project.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You must be a member of this project');
    }
    return project;
  }

  /**
   * Validates that assigneeId is a member of the given project.
   */
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

  /**
   * Validates that an epic belongs to the same project as the task.
   */
  private async validateEpic(epicId: number, projectId: number): Promise<void> {
    const epic = await this.epicsRepository.findOne({ where: { id: epicId } });
    if (!epic) throw new NotFoundException('Epic not found');
    if (epic.projectId !== projectId) {
      throw new BadRequestException(
        'The epic must belong to the same project as the task',
      );
    }
  }

  /**
   * Validates that a sprint belongs to the same project as the task.
   */
  private async validateSprint(sprintId: number, projectId: number): Promise<void> {
    const sprint = await this.sprintsRepository.findOne({ where: { id: sprintId } });
    if (!sprint) throw new NotFoundException('Sprint not found');
    if (sprint.projectId !== projectId) {
      throw new BadRequestException(
        'The sprint must belong to the same project as the task',
      );
    }
  }

  /**
   * Runs all cross-entity validations for create/update.
   */
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

    // Validate parentTask nesting: must be in same project and not itself a subtask
    if (dto.parentTaskId) {
      const parent = await this.tasksRepository.findOne({ where: { id: dto.parentTaskId } });
      if (!parent) throw new NotFoundException('Parent task not found');
      if (parent.projectId !== projectId) {
        throw new BadRequestException('Parent task must belong to the same project');
      }
      if (parent.parentTaskId) {
        throw new BadRequestException('A subtask cannot have its own subtasks (max nesting depth is 1)');
      }
    }

    const task = this.tasksRepository.create({
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

    const saved = await this.tasksRepository.save(task);
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
    },
  ): Promise<Task[]> {
    await this.assertMember(projectId, userId);

    const where: any = { projectId, isDeleted: false };
    if (filters?.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters?.sprintId) where.sprintId = filters.sprintId;
    if (filters?.epicId) where.epicId = filters.epicId;
    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;

    return this.tasksRepository.find({
      where,
      relations: TASK_RELATIONS,
      order: { createdAt: 'DESC' },
    });
  }

  async findAllForUser(userId: number): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { assigneeId: userId, isDeleted: false },
      relations: TASK_RELATIONS,
      order: { dueDate: 'ASC', createdAt: 'DESC' }, // Show nearest due date first
    });
  }

  async findOne(id: number): Promise<Task> {
    const task = await this.tasksRepository.findOne({
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

    if (dto.title !== undefined) task.title = dto.title;
    if (dto.description !== undefined) task.description = dto.description ?? null;
    if (dto.priority !== undefined) task.priority = dto.priority;
    if (dto.type !== undefined) task.type = dto.type;
    if (dto.storyPoints !== undefined) task.storyPoints = dto.storyPoints ?? null;
    if (dto.dueDate !== undefined) task.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    // Clear loaded relation objects so TypeORM doesn't override our FK changes
    if (dto.epicId !== undefined) { task.epicId = dto.epicId; task.epic = undefined as any; }
    if (dto.sprintId !== undefined) { task.sprintId = dto.sprintId; task.sprint = undefined as any; }
    if (dto.assigneeId !== undefined) { task.assigneeId = dto.assigneeId; task.assignee = undefined as any; }
    if (dto.parentTaskId !== undefined) { task.parentTaskId = dto.parentTaskId; task.parent = undefined as any; }

    await this.tasksRepository.save(task);
    return this.findOne(id);
  }

  /**
   * Soft-delete: sets isDeleted = true.
   * Only the task creator or a project admin/owner can delete.
   */
  async remove(id: number, userId: number): Promise<Task> {
    const task = await this.findOne(id);
    const project = await this.projectsService.findOne(task.projectId);

    // Check: user is the task creator, or admin/owner on the project, or site admin
    const currentUser = await this.usersService.findById(userId);
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
    await this.tasksRepository.save(task);
    return this.findOne(id);
  }

  // ─── Workflow Status Transitions ──────────────────────────

  private static readonly TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
    [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS],
    [TaskStatus.IN_PROGRESS]: [TaskStatus.IN_REVIEW, TaskStatus.TODO],
    [TaskStatus.IN_REVIEW]: [TaskStatus.DONE, TaskStatus.IN_PROGRESS],
    [TaskStatus.DONE]: [TaskStatus.IN_PROGRESS],
  };

  async changeStatus(id: number, newStatus: TaskStatus, userId: number): Promise<Task> {
    const task = await this.findOne(id);
    await this.assertMember(task.projectId, userId);

    // No-op if requesting the current status
    if (task.status === newStatus) {
      return task;
    }

    const allowed = TasksService.TRANSITIONS[task.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot move from ${task.status} to ${newStatus}`,
      );
    }

    task.status = newStatus;

    // Stamp or clear completedAt
    if (newStatus === TaskStatus.DONE) {
      task.completedAt = new Date();
    } else if (task.completedAt) {
      task.completedAt = null;
    }

    await this.tasksRepository.save(task);
    return this.findOne(id);
  }
}
