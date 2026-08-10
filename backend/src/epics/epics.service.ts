import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Epic } from './entities/epic.entity';
import { ProjectsService } from '../projects/projects.service';
import { CreateEpicDto } from './dto/create-epic.dto';
import { UpdateEpicDto } from './dto/update-epic.dto';

@Injectable()
export class EpicsService {
  constructor(
    @InjectRepository(Epic)
    private readonly epicsRepository: Repository<Epic>,
    private readonly projectsService: ProjectsService,
  ) {}

  /**
   * Verifies the user is a member of the given project.
   * Any role (owner/admin/member) is sufficient for epic CRUD.
   */
  private async assertMember(projectId: number, userId: number) {
    const project = await this.projectsService.findOne(projectId);
    const isMember = project.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You must be a member of this project');
    }
    return project;
  }

  async create(projectId: number, dto: CreateEpicDto, userId: number): Promise<Epic> {
    await this.assertMember(projectId, userId);

    const epic = this.epicsRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      status: dto.status, // defaults via entity if undefined
      projectId,
    });
    const saved = await this.epicsRepository.save(epic);
    return this.findOne(saved.id);
  }

  async findAllByProject(projectId: number, userId: number): Promise<Epic[]> {
    await this.assertMember(projectId, userId);

    return this.epicsRepository.find({
      where: { projectId },
      relations: { project: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Epic> {
    const epic = await this.epicsRepository.findOne({
      where: { id },
      relations: { project: true },
    });
    if (!epic) throw new NotFoundException('Epic not found');
    return epic;
  }

  async update(id: number, dto: UpdateEpicDto, userId: number): Promise<Epic> {
    const epic = await this.findOne(id);
    await this.assertMember(epic.projectId, userId);

    if (dto.name !== undefined) epic.name = dto.name;
    if (dto.description !== undefined) epic.description = dto.description ?? null;
    if (dto.status !== undefined) epic.status = dto.status;
    await this.epicsRepository.save(epic);

    return this.findOne(id);
  }

  async remove(id: number, userId: number): Promise<void> {
    const epic = await this.findOne(id);
    await this.assertMember(epic.projectId, userId);
    await this.epicsRepository.remove(epic);
  }
}
