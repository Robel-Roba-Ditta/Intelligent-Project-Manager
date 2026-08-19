import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Label } from '../domain/label.entity';
import { Task } from '../../task/domain/task.entity';
import { ProjectService } from '../../project/application/project.service';
import { UserService } from '../../user/application/user.service';
import { ProjectRole } from '../../project/domain/project-member.entity';
import { UserRole } from '../../user/domain/user.entity';
import { CreateLabelDto } from '../api/dto/create-label.dto';
import { UpdateLabelDto } from '../api/dto/update-label.dto';

@Injectable()
export class LabelService {
  constructor(
    @InjectRepository(Label)
    private readonly labelRepository: Repository<Label>,
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    private readonly projectService: ProjectService,
    private readonly userService: UserService,
  ) {}

  private async assertMember(projectId: number, userId: number) {
    const project = await this.projectService.findOne(projectId);
    const isMember = project.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You must be a member of this project');
    }
    return project;
  }

  private async assertCanAdmin(projectId: number, userId: number) {
    const project = await this.projectService.findOne(projectId);
    const currentUser = await this.userService.findById(userId);
    if (currentUser?.role === UserRole.ADMIN) return;

    const membership = project.members.find((m) => m.userId === userId);
    if (membership?.role === ProjectRole.OWNER || membership?.role === ProjectRole.ADMIN) return;

    throw new ForbiddenException('Only a project admin can do this');
  }

  // ─── Label CRUD (project-scoped) ────────────────────────────

  async create(projectId: number, dto: CreateLabelDto, userId: number): Promise<Label> {
    await this.assertMember(projectId, userId);

    const label = this.labelRepository.create({
      ...dto,
      projectId,
    });
    return this.labelRepository.save(label);
  }

  async findAllByProject(projectId: number, userId: number): Promise<Label[]> {
    await this.assertMember(projectId, userId);

    return this.labelRepository.find({
      where: { projectId },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Label> {
    const label = await this.labelRepository.findOne({ where: { id } });
    if (!label) throw new NotFoundException('Label not found');
    return label;
  }

  async update(id: number, dto: UpdateLabelDto, userId: number): Promise<Label> {
    const label = await this.findOne(id);
    await this.assertMember(label.projectId, userId);

    if (dto.name !== undefined) label.name = dto.name;
    if (dto.color !== undefined) label.color = dto.color;
    return this.labelRepository.save(label);
  }

  /**
   * Deleting a label entirely requires admin-or-owner on the project.
   * Cascade removes it from every task_labels join row.
   */
  async remove(id: number, userId: number): Promise<void> {
    const label = await this.findOne(id);
    await this.assertCanAdmin(label.projectId, userId);
    await this.labelRepository.remove(label);
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
