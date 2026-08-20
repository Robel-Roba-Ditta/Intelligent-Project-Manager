import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProjectService } from './project.service';
import { Project } from '../domain/project.entity';
import { ProjectMember, ProjectRole } from '../domain/project-member.entity';
import { UserService } from '../../user/application/user.service';
import { UserRole } from '../../user/domain/user.entity';


function makeMember(userId: number, role: ProjectRole): Partial<ProjectMember> {
  return { userId, role } as any;
}

function makeProject(members: Partial<ProjectMember>[]): Project {
  return { id: 1, name: 'Test', members } as any;
}

describe('ProjectService — authorization guards', () => {
  let service: ProjectService;
  let userService: { findById: jest.Mock; findByEmail: jest.Mock };

  beforeEach(async () => {
    userService = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: getRepositoryToken(Project), useValue: {} },
        { provide: getRepositoryToken(ProjectMember), useValue: {} },
        { provide: UserService, useValue: userService },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
  });


  describe('assertCanAdmin', () => {
    const callAssertCanAdmin = (svc: any, project: any, userId: number) =>
      svc.assertCanAdmin(project, userId);

    it('allows project owner', async () => {
      userService.findById.mockResolvedValue({ role: UserRole.MEMBER });
      const project = makeProject([makeMember(10, ProjectRole.OWNER)]);
      await expect(callAssertCanAdmin(service, project, 10)).resolves.toBeUndefined();
    });

    it('allows project admin', async () => {
      userService.findById.mockResolvedValue({ role: UserRole.MEMBER });
      const project = makeProject([makeMember(20, ProjectRole.ADMIN)]);
      await expect(callAssertCanAdmin(service, project, 20)).resolves.toBeUndefined();
    });

    it('rejects project member (non-admin)', async () => {
      userService.findById.mockResolvedValue({ role: UserRole.MEMBER });
      const project = makeProject([makeMember(30, ProjectRole.MEMBER)]);
      await expect(callAssertCanAdmin(service, project, 30)).rejects.toThrow(ForbiddenException);
    });

    it('rejects non-member', async () => {
      userService.findById.mockResolvedValue({ role: UserRole.MEMBER });
      const project = makeProject([makeMember(10, ProjectRole.OWNER)]);
      await expect(callAssertCanAdmin(service, project, 999)).rejects.toThrow(ForbiddenException);
    });

    it('allows global system admin (even if not a member)', async () => {
      userService.findById.mockResolvedValue({ role: UserRole.ADMIN });
      const project = makeProject([makeMember(10, ProjectRole.OWNER)]);
      await expect(callAssertCanAdmin(service, project, 50)).resolves.toBeUndefined();
    });
  });

  describe('assertCanOwn', () => {
    const callAssertCanOwn = (svc: any, project: any, userId: number) =>
      svc.assertCanOwn(project, userId);

    it('allows project owner', async () => {
      userService.findById.mockResolvedValue({ role: UserRole.MEMBER });
      const project = makeProject([makeMember(10, ProjectRole.OWNER)]);
      await expect(callAssertCanOwn(service, project, 10)).resolves.toBeUndefined();
    });

    it('rejects project admin', async () => {
      userService.findById.mockResolvedValue({ role: UserRole.MEMBER });
      const project = makeProject([makeMember(20, ProjectRole.ADMIN)]);
      await expect(callAssertCanOwn(service, project, 20)).rejects.toThrow(ForbiddenException);
    });

    it('rejects project member', async () => {
      userService.findById.mockResolvedValue({ role: UserRole.MEMBER });
      const project = makeProject([makeMember(30, ProjectRole.MEMBER)]);
      await expect(callAssertCanOwn(service, project, 30)).rejects.toThrow(ForbiddenException);
    });

    it('allows global system admin', async () => {
      userService.findById.mockResolvedValue({ role: UserRole.ADMIN });
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
