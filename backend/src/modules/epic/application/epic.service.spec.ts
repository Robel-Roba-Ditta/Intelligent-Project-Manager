import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EpicService } from './epic.service';
import { Epic } from '../domain/epic.entity';
import { ProjectService } from '../../project/application/project.service';

describe('EpicService', () => {
  let service: EpicService;
  let epicRepo: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock; find: jest.Mock; remove: jest.Mock };
  let projectService: { findOne: jest.Mock };

  beforeEach(async () => {
    epicRepo = {
      create: jest.fn().mockImplementation((e) => e),
      save: jest.fn().mockImplementation((e) => Promise.resolve({ ...e, id: 1 })),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      remove: jest.fn(),
    };
    projectService = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EpicService,
        { provide: getRepositoryToken(Epic), useValue: epicRepo },
        { provide: ProjectService, useValue: projectService },
      ],
    }).compile();

    service = module.get<EpicService>(EpicService);
  });

  it('rejects non-member from creating an epic', async () => {
    projectService.findOne.mockResolvedValue({ members: [{ userId: 10 }] });
    await expect(service.create(1, { name: 'Epic' } as any, 999))
      .rejects.toThrow(ForbiddenException);
  });

  it('allows a project member to create an epic', async () => {
    projectService.findOne.mockResolvedValue({ members: [{ userId: 1 }] });
    epicRepo.findOne.mockResolvedValue({ id: 1, name: 'Epic', projectId: 1 });

    const result = await service.create(1, { name: 'Epic' } as any, 1);
    expect(epicRepo.save).toHaveBeenCalled();
  });

  it('throws NotFoundException for missing epic', async () => {
    epicRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });
});
