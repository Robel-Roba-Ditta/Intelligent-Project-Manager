import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../domain/project.entity';
import { ProjectMember, ProjectRole } from '../domain/project-member.entity';
import { UserRole } from '../../user/domain/user.entity';
import { UserService } from '../../user/application/user.service';
import { CreateProjectDto } from '../api/dto/create-project.dto';
import { UpdateProjectDto } from '../api/dto/update-project.dto';
import { AddMemberDto } from '../api/dto/add-member.dto';
import { UpdateMemberRoleDto } from '../api/dto/update-member-role.dto';

const RELATIONS = { members: { user: true }, createdBy: true };

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly membersRepository: Repository<ProjectMember>,
    private readonly userService: UserService,
  ) {}

  

  async create(dto: CreateProjectDto, currentUserId: number): Promise<Project> {
    const project = await this.projectsRepository.save(
      this.projectsRepository.create({
        name: dto.name,
        description: dto.description ?? null,
        createdById: currentUserId,
      }),
    );

    
    await this.membersRepository.save(
      this.membersRepository.create({
        projectId: project.id,
        userId: currentUserId,
        role: ProjectRole.OWNER,
      }),
    );

    return this.findOne(project.id);
  }

  findAll(): Promise<Project[]> {
    return this.projectsRepository.find({
      relations: RELATIONS,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: RELATIONS,
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: number, dto: UpdateProjectDto, currentUserId: number): Promise<Project> {
    const project = await this.findOne(id);
    await this.assertCanAdmin(project, currentUserId);

    if (dto.name !== undefined) project.name = dto.name;
    if (dto.description !== undefined) project.description = dto.description;
    await this.projectsRepository.save(project);

    return this.findOne(id);
  }

  async setActive(id: number, isActive: boolean, currentUserId: number): Promise<Project> {
    const project = await this.findOne(id);
    
    await this.assertCanOwn(project, currentUserId);

    project.isActive = isActive;
    await this.projectsRepository.save(project);
    return this.findOne(id);
  }

  async remove(id: number, currentUserId: number): Promise<void> {
    const project = await this.findOne(id);
    
    await this.assertCanOwn(project, currentUserId);
    await this.projectsRepository.remove(project);
  }

  

  async listMembers(projectId: number): Promise<ProjectMember[]> {
    await this.findOne(projectId); 
    return this.membersRepository.find({
      where: { projectId },
      relations: { user: true },
      order: {
        role: 'ASC', 
        createdAt: 'ASC',
      },
    });
  }

  async addMember(
    projectId: number,
    dto: AddMemberDto,
    currentUserId: number,
  ): Promise<Project> {
    const project = await this.findOne(projectId);
    await this.assertCanAdmin(project, currentUserId);

    const targetUser = await this.userService.findByEmail(dto.email);
    if (!targetUser) {
      throw new NotFoundException('No account found with that email. They need to sign up first.');
    }

    const alreadyMember = project.members.some((m) => m.userId === targetUser.id);
    if (alreadyMember) {
      throw new ConflictException('That person is already a member of this project');
    }

    
    const requestedRole = dto.role ?? ProjectRole.MEMBER;
    if (requestedRole === ProjectRole.OWNER) {
      await this.assertCanOwn(project, currentUserId);
    }

    await this.membersRepository.save(
      this.membersRepository.create({
        projectId,
        userId: targetUser.id,
        role: requestedRole,
      }),
    );

    return this.findOne(projectId);
  }

  async updateMemberRole(
    projectId: number,
    targetUserId: number,
    dto: UpdateMemberRoleDto,
    currentUserId: number,
  ): Promise<Project> {
    const project = await this.findOne(projectId);
    await this.assertCanAdmin(project, currentUserId);

    const membership = project.members.find((m) => m.userId === targetUserId);
    if (!membership) throw new NotFoundException('That person is not a member of this project');

    
    if (membership.role === ProjectRole.OWNER) {
      throw new BadRequestException('Cannot change the owner\'s role. Transfer ownership instead.');
    }

    
    if (dto.role === ProjectRole.OWNER) {
      await this.assertCanOwn(project, currentUserId);
    }

    this.assertNotStrandingProject(project, targetUserId, dto.role);

    membership.role = dto.role;
    await this.membersRepository.save(membership);
    return this.findOne(projectId);
  }

  async removeMember(projectId: number, targetUserId: number, currentUserId: number): Promise<Project> {
    const project = await this.findOne(projectId);
    await this.assertCanAdmin(project, currentUserId);

    const membership = project.members.find((m) => m.userId === targetUserId);
    if (!membership) throw new NotFoundException('That person is not a member of this project');

    
    if (membership.role === ProjectRole.OWNER) {
      throw new BadRequestException('Cannot remove the project owner');
    }

    await this.membersRepository.remove(membership);
    return this.findOne(projectId);
  }

  

  
  private async assertCanAdmin(project: Project, currentUserId: number): Promise<void> {
    const currentUser = await this.userService.findById(currentUserId);
    if (currentUser?.role === UserRole.ADMIN) return;

    const membership = project.members.find((m) => m.userId === currentUserId);
    if (membership?.role === ProjectRole.OWNER || membership?.role === ProjectRole.ADMIN) return;

    throw new ForbiddenException('Only a project admin can do this');
  }

  
  private async assertCanOwn(project: Project, currentUserId: number): Promise<void> {
    const currentUser = await this.userService.findById(currentUserId);
    if (currentUser?.role === UserRole.ADMIN) return;

    const membership = project.members.find((m) => m.userId === currentUserId);
    if (membership?.role === ProjectRole.OWNER) return;

    throw new ForbiddenException('Only the project owner can do this');
  }

  
  private assertNotStrandingProject(
    project: Project,
    targetUserId: number,
    newRole: ProjectRole | undefined,
  ): void {
    const owners = project.members.filter((m) => m.role === ProjectRole.OWNER);
    const targetIsCurrentlyOwner = owners.some((m) => m.userId === targetUserId);
    const targetWouldStayOwner = newRole === ProjectRole.OWNER;

    if (targetIsCurrentlyOwner && owners.length === 1 && !targetWouldStayOwner) {
      throw new BadRequestException('A project must have at least one owner');
    }
  }
}
