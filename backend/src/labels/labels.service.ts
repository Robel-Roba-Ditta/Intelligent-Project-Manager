import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Label } from './entities/label.entity';
import { Task } from '../tasks/entities/task.entity';
import { ProjectsService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';
import { ProjectRole } from '../projects/entities/project-member.entity';
import { UserRole } from '../users/entities/user.entity';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';

@Injectable()
export class LabelsService {
  constructor(
    @InjectRepository(Label)
    private readonly labelsRepository: Repository<Label>,
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
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

  private async assertCanAdmin(projectId: number, userId: number) {
    const project = await this.projectsService.findOne(projectId);
    const currentUser = await this.usersService.findById(userId);
    if (currentUser?.role === UserRole.ADMIN) return;

    const membership = project.members.find((m) => m.userId === userId);
    if (membership?.role === ProjectRole.OWNER || membership?.role === ProjectRole.ADMIN) return;

    throw new ForbiddenException('Only a project admin can do this');
  }

  // ─── Label CRUD (project-scoped) ────────────────────────────

  async create(projectId: number, dto: CreateLabelDto, userId: number): Promise<Label> {
    await this.assertMember(projectId, userId);

    const label = this.labelsRepository.create({
      ...dto,
      projectId,
    });
    return this.labelsRepository.save(label);
  }

  async findAllByProject(projectId: number, userId: number): Promise<Label[]> {
    await this.assertMember(projectId, userId);

    return this.labelsRepository.find({
      where: { projectId },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Label> {
    const label = await this.labelsRepository.findOne({ where: { id } });
    if (!label) throw new NotFoundException('Label not found');
    return label;
  }

  async update(id: number, dto: UpdateLabelDto, userId: number): Promise<Label> {
    const label = await this.findOne(id);
    await this.assertMember(label.projectId, userId);

    if (dto.name !== undefined) label.name = dto.name;
    if (dto.color !== undefined) label.color = dto.color;
    return this.labelsRepository.save(label);
  }

  /**
   * Deleting a label entirely requires admin-or-owner on the project.
   * Cascade removes it from every task_labels join row.
   */
  async remove(id: number, userId: number): Promise<void> {
    const label = await this.findOne(id);
    await this.assertCanAdmin(label.projectId, userId);
    await this.labelsRepository.remove(label);
  }

  // ─── Task<->Label attach/detach ────────────────────────────

  private async loadTaskWithLabels(taskId: number): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId },
      relations: { labels: true, project: { members: true } },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  private assertTaskMember(task: Task, userId: number): void {
    const isMember = task.project.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You must be a member of this project');
    }
  }

  async attachLabel(taskId: number, labelId: number, userId: number): Promise<Task> {
    const task = await this.loadTaskWithLabels(taskId);
    this.assertTaskMember(task, userId);

    const label = await this.findOne(labelId);

    const alreadyAttached = task.labels.some((l) => l.id === labelId);
    if (alreadyAttached) {
      throw new ConflictException('Label is already attached to this task');
    }

    task.labels.push(label);
    await this.tasksRepository.save(task);

    return this.loadTaskWithLabels(taskId);
  }

  async detachLabel(taskId: number, labelId: number, userId: number): Promise<Task> {
    const task = await this.loadTaskWithLabels(taskId);
    this.assertTaskMember(task, userId);

    const idx = task.labels.findIndex((l) => l.id === labelId);
    if (idx === -1) {
      throw new NotFoundException('Label is not attached to this task');
    }

    task.labels.splice(idx, 1);
    await this.tasksRepository.save(task);

    return this.loadTaskWithLabels(taskId);
  }
}
