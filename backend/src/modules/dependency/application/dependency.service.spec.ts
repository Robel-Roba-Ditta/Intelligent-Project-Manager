import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DependencyService } from './dependency.service';
import { TaskDependency } from '../domain/task-dependency.entity';
import { Task } from '../../task/domain/task.entity';
import { ProjectMember } from '../../project/domain/project-member.entity';

describe('DependencyService', () => {
  let service: DependencyService;
  let depsRepo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock; findOneOrFail: jest.Mock };
  let tasksRepo: { findOne: jest.Mock };
  let membersRepo: { findOne: jest.Mock };
  let eventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    depsRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((d) => d),
      save: jest.fn().mockImplementation((d) => Promise.resolve({ ...d, id: 1 })),
      findOneOrFail: jest.fn().mockResolvedValue({ id: 1, blockingTask: {}, blockedTask: {} }),
    };
    tasksRepo = { findOne: jest.fn() };
    membersRepo = { findOne: jest.fn().mockResolvedValue({ userId: 1, projectId: 1 }) };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DependencyService,
        { provide: getRepositoryToken(TaskDependency), useValue: depsRepo },
        { provide: getRepositoryToken(Task), useValue: tasksRepo },
        { provide: getRepositoryToken(ProjectMember), useValue: membersRepo },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<DependencyService>(DependencyService);
  });

  function makeTask(id: number, projectId = 1): Partial<Task> {
    return { id, projectId } as any;
  }

  it('rejects self-referencing dependency', async () => {
    tasksRepo.findOne.mockResolvedValue(makeTask(1));

    await expect(
      service.create(1, { blockedTaskId: 1 } as any, 1),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects cross-project dependency', async () => {
    tasksRepo.findOne
      .mockResolvedValueOnce(makeTask(1, 1))
      .mockResolvedValueOnce(makeTask(2, 2));

    await expect(
      service.create(1, { blockedTaskId: 2 } as any, 1),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects reverse cycle (A blocks B, then B blocks A)', async () => {
    tasksRepo.findOne
      .mockResolvedValueOnce(makeTask(2, 1))  
      .mockResolvedValueOnce(makeTask(1, 1)); 

    depsRepo.findOne.mockResolvedValueOnce({ id: 99 }); 

    await expect(
      service.create(2, { blockedTaskId: 1 } as any, 1),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects duplicate dependency', async () => {
    tasksRepo.findOne
      .mockResolvedValueOnce(makeTask(1, 1))
      .mockResolvedValueOnce(makeTask(2, 1));

    depsRepo.findOne
      .mockResolvedValueOnce(null)    
      .mockResolvedValueOnce({ id: 1 }); 

    await expect(
      service.create(1, { blockedTaskId: 2 } as any, 1),
    ).rejects.toThrow(BadRequestException);
  });

  it('allows valid dependency creation', async () => {
    tasksRepo.findOne
      .mockResolvedValueOnce(makeTask(1, 1))
      .mockResolvedValueOnce(makeTask(2, 1));

    depsRepo.findOne
      .mockResolvedValueOnce(null) 
      .mockResolvedValueOnce(null); 

    const result = await service.create(1, { blockedTaskId: 2 } as any, 1);
    expect(depsRepo.save).toHaveBeenCalled();
    expect(eventEmitter.emit).toHaveBeenCalledWith('task.dependency_added', expect.anything());
  });
});
