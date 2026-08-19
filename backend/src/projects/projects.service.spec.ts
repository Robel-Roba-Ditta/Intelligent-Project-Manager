import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { ProjectMember, ProjectRole } from './entities/project-member.entity';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';

// ─── Helpers ──────────────────────────────────────────────

function makeMember(userId: number, role: ProjectRole): Partial<ProjectMember> {
  return { userId, role } as any;
}

function makeProject(members: Partial<ProjectMember>[]): Project {
  return { id: 1, name: 'Test', members } as any;
}

describe('ProjectsService — authorization guards', () => {
  let service: ProjectsService;
  let usersService: { findById: jest.Mock; findByEmail: jest.Mock };

  beforeEach(async () => {
    usersService = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: getRepositoryToken(Project), useValue: {} },
        { provide: getRepositoryToken(ProjectMember), useValue: {} },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  // ─── assertCanAdmin (private — test indirectly via update) ───

  describe('assertCanAdmin', () => {
    // Access private method for isolated testing
    const callAssertCanAdmin = (svc: any, project: any, userId: number) =>
      svc.assertCanAdmin(project, userId);

    it('allows project owner', async () => {
      usersService.findById.mockResolvedValue({ role: UserRole.MEMBER });
      const project = makeProject([makeMember(10, ProjectRole.OWNER)]);
      await expect(callAssertCanAdmin(service, project, 10)).resolves.toBeUndefined();
    });

    it('allows project admin', async () => {
      usersService.findById.mockResolvedValue({ role: UserRole.MEMBER });
      const project = makeProject([makeMember(20, ProjectRole.ADMIN)]);
      await expect(callAssertCanAdmin(service, project, 20)).resolves.toBeUndefined();
    });

    it('rejects project member (non-admin)', async () => {
      usersService.findById.mockResolvedValue({ role: UserRole.MEMBER });
      const project = makeProject([makeMember(30, ProjectRole.MEMBER)]);
      await expect(callAssertCanAdmin(service, project, 30)).rejects.toThrow(ForbiddenException);
    });

    it('rejects non-member', async () => {
      usersService.findById.mockResolvedValue({ role: UserRole.MEMBER });
      const project = makeProject([makeMember(10, ProjectRole.OWNER)]);
      await expect(callAssertCanAdmin(service, project, 999)).rejects.toThrow(ForbiddenException);
    });

    it('allows global system admin (even if not a member)', async () => {
      usersService.findById.mockResolvedValue({ role: UserRole.ADMIN });
      const project = makeProject([makeMember(10, ProjectRole.OWNER)]);
      await expect(callAssertCanAdmin(service, project, 50)).resolves.toBeUndefined();
    });
  });

  describe('assertCanOwn', () => {
    const callAssertCanOwn = (svc: any, project: any, userId: number) =>
      svc.assertCanOwn(project, userId);

    it('allows project owner', async () => {
      usersService.findById.mockResolvedValue({ role: UserRole.MEMBER });
      const project = makeProject([makeMember(10, ProjectRole.OWNER)]);
      await expect(callAssertCanOwn(service, project, 10)).resolves.toBeUndefined();
    });

    it('rejects project admin', async () => {
      usersService.findById.mockResolvedValue({ role: UserRole.MEMBER });
      const project = makeProject([makeMember(20, ProjectRole.ADMIN)]);
      await expect(callAssertCanOwn(service, project, 20)).rejects.toThrow(ForbiddenException);
    });

    it('rejects project member', async () => {
      usersService.findById.mockResolvedValue({ role: UserRole.MEMBER });
      const project = makeProject([makeMember(30, ProjectRole.MEMBER)]);
      await expect(callAssertCanOwn(service, project, 30)).rejects.toThrow(ForbiddenException);
    });

    it('allows global system admin', async () => {
      usersService.findById.mockResolvedValue({ role: UserRole.ADMIN });
      const project = makeProject([]);
      await expect(callAssertCanOwn(service, project, 50)).resolves.toBeUndefined();
    });
  });

  describe('assertNotStrandingProject', () => {
    const call = (svc: any, project: any, targetUserId: number, newRole?: ProjectRole) =>
      svc.assertNotStrandingProject(project, targetUserId, newRole);

    it('throws when demoting the last owner', () => {
      const project = makeProject([makeMember(10, ProjectRole.OWNER)]);
      expect(() => call(service, project, 10, ProjectRole.MEMBER)).toThrow(BadRequestException);
    });

    it('throws when demoting the last owner to admin', () => {
      const project = makeProject([makeMember(10, ProjectRole.OWNER)]);
      expect(() => call(service, project, 10, ProjectRole.ADMIN)).toThrow(BadRequestException);
    });

    it('allows demoting an owner when another owner exists', () => {
      const project = makeProject([
        makeMember(10, ProjectRole.OWNER),
        makeMember(20, ProjectRole.OWNER),
      ]);
      expect(() => call(service, project, 10, ProjectRole.MEMBER)).not.toThrow();
    });

    it('allows changing a non-owner member role freely', () => {
      const project = makeProject([
        makeMember(10, ProjectRole.OWNER),
        makeMember(20, ProjectRole.MEMBER),
      ]);
      expect(() => call(service, project, 20, ProjectRole.ADMIN)).not.toThrow();
    });

    it('allows keeping the owner as owner (no-op)', () => {
      const project = makeProject([makeMember(10, ProjectRole.OWNER)]);
      expect(() => call(service, project, 10, ProjectRole.OWNER)).not.toThrow();
    });
  });
});
