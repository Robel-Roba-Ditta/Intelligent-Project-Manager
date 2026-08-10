import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sprint, SprintStatus } from './entities/sprint.entity';
import { ProjectsService } from '../projects/projects.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';

@Injectable()
export class SprintsService {
  constructor(
    @InjectRepository(Sprint)
    private readonly sprintsRepository: Repository<Sprint>,
    private readonly projectsService: ProjectsService,
  ) {}

  private async assertMember(projectId: number, userId: number) {
    const project = await this.projectsService.findOne(projectId);
    const isMember = project.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You must be a member of this project');
    }
    return project;
  }

  async create(projectId: number, dto: CreateSprintDto, userId: number): Promise<Sprint> {
    await this.assertMember(projectId, userId);

    const sprint = this.sprintsRepository.create({
      name: dto.name,
      goal: dto.goal ?? null,
      projectId,
    });
    const saved = await this.sprintsRepository.save(sprint);
    return this.findOne(saved.id);
  }

  async findAllByProject(projectId: number, userId: number): Promise<Sprint[]> {
    await this.assertMember(projectId, userId);

    return this.sprintsRepository.find({
      where: { projectId },
      relations: { project: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveForUser(userId: number): Promise<Sprint[]> {
    return this.sprintsRepository.find({
      where: {
        status: SprintStatus.ACTIVE,
        project: { members: { userId } },
      },
      relations: { project: true },
      order: { endDate: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Sprint> {
    const sprint = await this.sprintsRepository.findOne({
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
    await this.sprintsRepository.save(sprint);

    return this.findOne(id);
  }

  async remove(id: number, userId: number): Promise<void> {
    const sprint = await this.findOne(id);
    await this.assertMember(sprint.projectId, userId);
    await this.sprintsRepository.remove(sprint);
  }

  // ─── State-machine action endpoints ────────────────────────

  /**
   * PLANNED → ACTIVE, stamps startDate.
   */
  async start(id: number, userId: number): Promise<Sprint> {
    const sprint = await this.findOne(id);
    await this.assertMember(sprint.projectId, userId);

    if (sprint.status !== SprintStatus.PLANNED) {
      throw new BadRequestException(
        `Cannot start a sprint that is ${sprint.status.toLowerCase()}. Only PLANNED sprints can be started.`,
      );
    }

    // Business rule: only one active sprint per project
    const existingActive = await this.sprintsRepository.findOne({
      where: { projectId: sprint.projectId, status: SprintStatus.ACTIVE },
    });
    if (existingActive) {
      throw new BadRequestException(
        'Complete the active sprint first',
      );
    }

    sprint.status = SprintStatus.ACTIVE;
    sprint.startDate = new Date();
    await this.sprintsRepository.save(sprint);
    return this.findOne(id);
  }

  /**
   * ACTIVE → COMPLETED, stamps endDate.
   */
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
    await this.sprintsRepository.save(sprint);
    return this.findOne(id);
  }
}
