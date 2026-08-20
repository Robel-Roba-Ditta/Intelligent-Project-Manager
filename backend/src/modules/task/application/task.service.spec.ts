import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TaskService } from './task.service';
import { Task, TaskStatus } from '../domain/task.entity';
import { Epic } from '../../epic/domain/epic.entity';
import { Sprint } from '../../sprint/domain/sprint.entity';
import { ProjectMember } from '../../project/domain/project-member.entity';
import { ProjectService } from '../../project/application/project.service';
import { UserService } from '../../user/application/user.service';

describe('TaskService — status transitions', () => {
  let service: TaskService;
  let taskRepo: { findOne: jest.Mock; save: jest.Mock };
  let projectService: { findOne: jest.Mock };
  let eventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    taskRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((t) => Promise.resolve(t)),
    };
    projectService = {
      findOne: jest.fn().mockResolvedValue({ members: [{ userId: 1 }] }),
    };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: getRepositoryToken(Task), useValue: taskRepo },
        { provide: getRepositoryToken(Epic), useValue: {} },
        { provide: getRepositoryToken(Sprint), useValue: {} },
        { provide: getRepositoryToken(ProjectMember), useValue: {} },
        { provide: ProjectService, useValue: projectService },
        { provide: UserService, useValue: {} },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
  });

  function makeTask(status: TaskStatus, id = 1): Task {
    return {
      id,
      status,
      projectId: 1,
      completedAt: status === TaskStatus.DONE ? new Date() : null,
    } as any;
  }

  async function changeStatus(from: TaskStatus, to: TaskStatus) {
    const task = makeTask(from);
    taskRepo.findOne.mockResolvedValue(task);
    return service.changeStatus(task.id, to, 1);
  }


  it('TODO → IN_PROGRESS is allowed', async () => {
    const result = await changeStatus(TaskStatus.TODO, TaskStatus.IN_PROGRESS);
    expect(result.status).toBe(TaskStatus.IN_PROGRESS);
  });

  it('IN_PROGRESS → TODO is allowed', async () => {
    const result = await changeStatus(TaskStatus.IN_PROGRESS, TaskStatus.TODO);
    expect(result.status).toBe(TaskStatus.TODO);
  });

  it('IN_PROGRESS → IN_REVIEW is allowed', async () => {
    const result = await changeStatus(TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW);
    expect(result.status).toBe(TaskStatus.IN_REVIEW);
  });

  it('IN_REVIEW → IN_PROGRESS is allowed', async () => {
    const result = await changeStatus(TaskStatus.IN_REVIEW, TaskStatus.IN_PROGRESS);
    expect(result.status).toBe(TaskStatus.IN_PROGRESS);
  });

  it('IN_REVIEW → DONE is allowed', async () => {
    const result = await changeStatus(TaskStatus.IN_REVIEW, TaskStatus.DONE);
    expect(result.status).toBe(TaskStatus.DONE);
  });

  it('DONE → IN_REVIEW is allowed', async () => {
    const result = await changeStatus(TaskStatus.DONE, TaskStatus.IN_REVIEW);
    expect(result.status).toBe(TaskStatus.IN_REVIEW);
  });


  it('TODO → DONE is rejected', async () => {
    await expect(changeStatus(TaskStatus.TODO, TaskStatus.DONE)).rejects.toThrow(BadRequestException);
  });

  it('TODO → IN_REVIEW is rejected', async () => {
    await expect(changeStatus(TaskStatus.TODO, TaskStatus.IN_REVIEW)).rejects.toThrow(BadRequestException);
  });

  it('DONE → TODO is rejected', async () => {
    await expect(changeStatus(TaskStatus.DONE, TaskStatus.TODO)).rejects.toThrow(BadRequestException);
  });

  it('DONE → IN_PROGRESS is rejected', async () => {
    await expect(changeStatus(TaskStatus.DONE, TaskStatus.IN_PROGRESS)).rejects.toThrow(BadRequestException);
  });

  it('IN_PROGRESS → DONE is rejected (must go through IN_REVIEW)', async () => {
    await expect(changeStatus(TaskStatus.IN_PROGRESS, TaskStatus.DONE)).rejects.toThrow(BadRequestException);
  });


  it('same status is a no-op (returns unchanged task)', async () => {
    const task = makeTask(TaskStatus.TODO);
    taskRepo.findOne.mockResolvedValue(task);
    const result = await service.changeStatus(task.id, TaskStatus.TODO, 1);
    expect(result.status).toBe(TaskStatus.TODO);
    expect(taskRepo.save).not.toHaveBeenCalled();
  });


  it('stamps completedAt when moving to DONE', async () => {
    const task = makeTask(TaskStatus.IN_REVIEW);
    taskRepo.findOne.mockResolvedValue(task);
    await service.changeStatus(task.id, TaskStatus.DONE, 1);
    expect(task.completedAt).toBeInstanceOf(Date);
  });

  it('clears completedAt when leaving DONE', async () => {
    const task = makeTask(TaskStatus.DONE);
    task.completedAt = new Date();
    taskRepo.findOne.mockResolvedValue(task);
    await service.changeStatus(task.id, TaskStatus.IN_REVIEW, 1);
    expect(task.completedAt).toBeNull();
  });


  it('emits task.status_changed event on legal transition', async () => {
    const task = makeTask(TaskStatus.TODO);
    taskRepo.findOne.mockResolvedValue(task);
    await service.changeStatus(task.id, TaskStatus.IN_PROGRESS, 1);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'task.status_changed',
      expect.objectContaining({
        taskId: task.id,
        actorId: 1,
        fromStatus: TaskStatus.TODO,
        toStatus: TaskStatus.IN_PROGRESS,
      }),
    );
  });
});
