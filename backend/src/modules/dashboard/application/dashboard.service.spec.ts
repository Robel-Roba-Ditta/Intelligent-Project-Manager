import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { Task, TaskStatus } from '../../task/domain/task.entity';
import { Project } from '../../project/domain/project.entity';
import { ProjectMember } from '../../project/domain/project-member.entity';
import { Sprint } from '../../sprint/domain/sprint.entity';
import { ActivityLog } from '../../activity/domain/activity-log.entity';

describe('DashboardService — mapStatus', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(Task), useValue: {} },
        { provide: getRepositoryToken(Project), useValue: {} },
        { provide: getRepositoryToken(ProjectMember), useValue: {} },
        { provide: getRepositoryToken(Sprint), useValue: {} },
        { provide: getRepositoryToken(ActivityLog), useValue: {} },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  const callMapStatus = (svc: any, status: TaskStatus) => svc.mapStatus(status);

  it('maps TODO to "todo"', () => {
    expect(callMapStatus(service, TaskStatus.TODO)).toBe('todo');
  });

  it('maps IN_PROGRESS to "in_progress"', () => {
    expect(callMapStatus(service, TaskStatus.IN_PROGRESS)).toBe('in_progress');
  });

  it('maps IN_REVIEW to "in_review" (not "in_progress")', () => {
    expect(callMapStatus(service, TaskStatus.IN_REVIEW)).toBe('in_review');
  });

  it('maps DONE to "done"', () => {
    expect(callMapStatus(service, TaskStatus.DONE)).toBe('done');
  });

  it('emptyDashboard includes in_review key', () => {
    const empty = (service as any).emptyDashboard();
    expect(empty.tasksByStatus).toEqual({
      todo: 0,
      in_progress: 0,
      in_review: 0,
      done: 0,
    });
  });
});
