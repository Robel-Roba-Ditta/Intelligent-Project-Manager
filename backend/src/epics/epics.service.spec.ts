import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EpicsService } from './epics.service';
import { Epic } from './entities/epic.entity';
import { ProjectsService } from '../projects/projects.service';

describe('EpicsService', () => {
  let service: EpicsService;
  let epicsRepo: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock; find: jest.Mock; remove: jest.Mock };
  let projectsService: { findOne: jest.Mock };

  beforeEach(async () => {
    epicsRepo = {
      create: jest.fn().mockImplementation((e) => e),
      save: jest.fn().mockImplementation((e) => Promise.resolve({ ...e, id: 1 })),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      remove: jest.fn(),
    };
    projectsService = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EpicsService,
        { provide: getRepositoryToken(Epic), useValue: epicsRepo },
        { provide: ProjectsService, useValue: projectsService },
      ],
    }).compile();

    service = module.get<EpicsService>(EpicsService);
  });

  it('rejects non-member from creating an epic', async () => {
    projectsService.findOne.mockResolvedValue({ members: [{ userId: 10 }] });
    await expect(service.create(1, { name: 'Epic' } as any, 999))
      .rejects.toThrow(ForbiddenException);
  });

  it('allows a project member to create an epic', async () => {
    projectsService.findOne.mockResolvedValue({ members: [{ userId: 1 }] });
    epicsRepo.findOne.mockResolvedValue({ id: 1, name: 'Epic', projectId: 1 });

    const result = await service.create(1, { name: 'Epic' } as any, 1);
    expect(epicsRepo.save).toHaveBeenCalled();
  });

  it('throws NotFoundException for missing epic', async () => {
    epicsRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });
});
