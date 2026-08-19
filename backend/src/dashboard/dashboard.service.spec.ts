import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { Task, TaskStatus } from '../tasks/entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { Sprint } from '../sprints/entities/sprint.entity';
import { ActivityLog } from '../activity/entities/activity-log.entity';

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

  // Access private mapStatus method
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

  // Test emptyDashboard has 4 status keys
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
