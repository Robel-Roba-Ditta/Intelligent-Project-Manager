import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SprintsService } from './sprints.service';
import { Sprint, SprintStatus } from './entities/sprint.entity';
import { Task } from '../tasks/entities/task.entity';
import { ActivityLog } from '../activity/entities/activity-log.entity';
import { ProjectsService } from '../projects/projects.service';

describe('SprintsService', () => {
  let service: SprintsService;
  let sprintsRepo: {
    findOne: jest.Mock; save: jest.Mock; create: jest.Mock;
    find: jest.Mock; count: jest.Mock; remove: jest.Mock;
  };
  let tasksRepo: { count: jest.Mock };
  let activityRepo: { createQueryBuilder: jest.Mock };
  let projectsService: { findOne: jest.Mock };

  beforeEach(async () => {
    sprintsRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((s) => Promise.resolve(s)),
      create: jest.fn().mockImplementation((s) => s),
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn(),
      remove: jest.fn(),
    };
    tasksRepo = { count: jest.fn() };
    activityRepo = { createQueryBuilder: jest.fn() };
    projectsService = {
      findOne: jest.fn().mockResolvedValue({ members: [{ userId: 1 }] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SprintsService,
        { provide: getRepositoryToken(Sprint), useValue: sprintsRepo },
        { provide: getRepositoryToken(Task), useValue: tasksRepo },
        { provide: getRepositoryToken(ActivityLog), useValue: activityRepo },
        { provide: ProjectsService, useValue: projectsService },
      ],
    }).compile();

    service = module.get<SprintsService>(SprintsService);
  });

  function makeSprint(overrides: Partial<Sprint> = {}): Sprint {
    return {
      id: 1, name: 'Sprint 1', goal: null, projectId: 1,
      status: SprintStatus.PLANNED, startDate: null, endDate: null,
      project: { id: 1, members: [{ userId: 1 }] } as any,
      ...overrides,
    } as Sprint;
  }

  describe('start', () => {
    it('sets status to ACTIVE and stamps startDate', async () => {
      const sprint = makeSprint();
      // First findOne call (line 102) → returns the sprint
      sprintsRepo.findOne.mockResolvedValueOnce(sprint);
      // Second findOne call (line 112) → no existing active
      sprintsRepo.findOne.mockResolvedValueOnce(null);
      // Third findOne call (line 124, return after save) → return updated sprint
      sprintsRepo.findOne.mockResolvedValueOnce({
        ...sprint, status: SprintStatus.ACTIVE, startDate: new Date(),
      });

      const result = await service.start(1, 1);
      expect(result.status).toBe(SprintStatus.ACTIVE);
      expect(result.startDate).toBeInstanceOf(Date);
    });

    it('rejects starting a non-PLANNED sprint', async () => {
      const sprint = makeSprint({ status: SprintStatus.ACTIVE });
      sprintsRepo.findOne.mockResolvedValueOnce(sprint);

      await expect(service.start(1, 1)).rejects.toThrow(BadRequestException);
    });

    it('rejects when another sprint is already active in the project', async () => {
      const sprint = makeSprint();
      const activeSprint = makeSprint({ id: 2, status: SprintStatus.ACTIVE });
      sprintsRepo.findOne
        .mockResolvedValueOnce(sprint)      // findOne for our sprint
        .mockResolvedValueOnce(activeSprint); // existing active check

      await expect(service.start(1, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('complete', () => {
    it('sets status to COMPLETED and stamps endDate', async () => {
      const sprint = makeSprint({ status: SprintStatus.ACTIVE, startDate: new Date() });
      sprintsRepo.findOne.mockResolvedValueOnce(sprint);
      sprintsRepo.findOne.mockResolvedValueOnce({
        ...sprint, status: SprintStatus.COMPLETED, endDate: new Date(),
      });

      const result = await service.complete(1, 1);
      expect(result.status).toBe(SprintStatus.COMPLETED);
      expect(result.endDate).toBeInstanceOf(Date);
    });

    it('rejects completing a non-ACTIVE sprint', async () => {
      const sprint = makeSprint({ status: SprintStatus.PLANNED });
      sprintsRepo.findOne.mockResolvedValueOnce(sprint);

      await expect(service.complete(1, 1)).rejects.toThrow(BadRequestException);
    });

    it('rejects completing an already-completed sprint', async () => {
      const sprint = makeSprint({ status: SprintStatus.COMPLETED });
      sprintsRepo.findOne.mockResolvedValueOnce(sprint);

      await expect(service.complete(1, 1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('burndown ideal-line interpolation', () => {
    it('computes correct ideal values at start, midpoint, and end', async () => {
      const start = new Date('2026-08-01');
      const end = new Date('2026-08-11'); // 10-day span
      const sprint = makeSprint({
        status: SprintStatus.COMPLETED,
        startDate: start,
        endDate: end,
      });
      sprintsRepo.findOne.mockResolvedValueOnce(sprint);
      tasksRepo.count.mockResolvedValue(10);

      // Mock activity query — no tasks completed
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      activityRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getBurndown(1);

      expect(result.totalTasks).toBe(10);
      expect(result.days.length).toBe(11); // 10-day span → 11 data points

      // First day: ideal = totalTasks (10)
      expect(result.days[0].idealRemaining).toBe(10);

      // Midpoint (day 5): ideal = 10 - (10 * 5/10) = 5
      expect(result.days[5].idealRemaining).toBe(5);

      // Last day: ideal = 0
      expect(result.days[10].idealRemaining).toBe(0);

      // Actual remaining = 10 for all days (no completions)
      for (const day of result.days) {
        expect(day.actualRemaining).toBe(10);
      }
    });

    it('rejects burndown for unstarted sprint', async () => {
      const sprint = makeSprint({ startDate: null });
      sprintsRepo.findOne.mockResolvedValueOnce(sprint);

      await expect(service.getBurndown(1)).rejects.toThrow(BadRequestException);
    });
  });
});
