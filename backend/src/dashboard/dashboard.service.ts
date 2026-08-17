import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, LessThan } from 'typeorm';
import { Project } from '../projects/entities/project.entity';
import { ProjectMember } from '../projects/entities/project-member.entity';
import { Task, TaskStatus, TaskPriority } from '../tasks/entities/task.entity';
import { Sprint, SprintStatus } from '../sprints/entities/sprint.entity';
import { ActivityLog } from '../activity/entities/activity-log.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly membersRepo: Repository<ProjectMember>,
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,
    @InjectRepository(Sprint)
    private readonly sprintsRepo: Repository<Sprint>,
    @InjectRepository(ActivityLog)
    private readonly activityRepo: Repository<ActivityLog>,
  ) {}

  async getDashboard(userId: number) {
    // 1. Get user's project IDs
    const memberships = await this.membersRepo.find({ where: { userId } });
    const projectIds = memberships.map((m) => m.projectId);
    if (projectIds.length === 0) {
      return this.emptyDashboard();
    }

    // 2. Get active projects
    const projects = await this.projectsRepo.find({
      where: { id: In(projectIds) },
    });
    const activeProjects = projects.filter((p) => p.isActive);
    const activeProjectIds = activeProjects.map((p) => p.id);

    // 3. All non-deleted tasks across user's projects
    const allTasks = activeProjectIds.length > 0
      ? await this.tasksRepo.find({
          where: { projectId: In(activeProjectIds), isDeleted: false },
          relations: { assignee: true, project: true },
        })
      : [];

    // 4. Stats
    const openTasks = allTasks.filter((t) => t.status !== TaskStatus.DONE);
    const now = new Date();

    // Active sprints
    const activeSprints = activeProjectIds.length > 0
      ? await this.sprintsRepo.find({
          where: { projectId: In(activeProjectIds), status: SprintStatus.ACTIVE },
          order: { startDate: 'DESC' },
        })
      : [];

    const activeSprintIds = activeSprints.map((s) => s.id);
    const completedThisSprint = allTasks.filter(
      (t) => t.status === TaskStatus.DONE && t.sprintId && activeSprintIds.includes(t.sprintId),
    ).length;

    const overdueTasks = openTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now,
    ).length;

    // 5. Sprint progress card — pick most recent active sprint
    let sprint: any = null;
    if (activeSprints.length > 0) {
      const s = activeSprints[0];
      const sprintTasks = allTasks.filter((t) => t.sprintId === s.id);
      const totalTasks = sprintTasks.length;
      const completedTasks = sprintTasks.filter((t) => t.status === TaskStatus.DONE).length;
      sprint = {
        id: String(s.id),
        name: s.name,
        goal: s.goal || '',
        startDate: s.startDate ? s.startDate.toISOString().split('T')[0] : '',
        endDate: s.endDate ? s.endDate.toISOString().split('T')[0] : '',
        totalTasks,
        completedTasks,
      };
    }

    // 6. tasksByStatus (lowercase to match types.ts — merge IN_REVIEW into in_progress)
    const tasksByStatus = { todo: 0, in_progress: 0, done: 0 };
    for (const t of allTasks) {
      if (t.status === TaskStatus.TODO) tasksByStatus.todo++;
      else if (t.status === TaskStatus.IN_PROGRESS || t.status === TaskStatus.IN_REVIEW) tasksByStatus.in_progress++;
      else if (t.status === TaskStatus.DONE) tasksByStatus.done++;
    }

    // 6b. tasksByPriority
    const tasksByPriority = { low: 0, medium: 0, high: 0, urgent: 0 };
    for (const t of allTasks) {
      const p = t.priority?.toLowerCase();
      if (p === 'low') tasksByPriority.low++;
      else if (p === 'medium') tasksByPriority.medium++;
      else if (p === 'high') tasksByPriority.high++;
      else if (p === 'urgent') tasksByPriority.urgent++;
    }

    // 7. weeklyTrend — last 7 days from ActivityLog
    const weeklyTrend = await this.buildWeeklyTrend(activeProjectIds);

    // 8. myTasks — assigned to user, not done
    const myTasks = allTasks
      .filter((t) => t.assigneeId === userId && t.status !== TaskStatus.DONE)
      .map((t) => ({
        id: String(t.id),
        title: t.title,
        status: this.mapStatus(t.status),
        priority: t.priority.toLowerCase() as any,
        assignee: {
          id: String(t.assignee?.id || userId),
          name: t.assignee?.fullName || 'You',
        },
        dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
        projectName: t.project?.name || '',
      }));

    // 9. teamWorkload
    const workloadMap = new Map<number, { name: string; count: number }>();
    for (const t of openTasks) {
      if (t.assigneeId && t.assignee) {
        const existing = workloadMap.get(t.assigneeId);
        if (existing) {
          existing.count++;
        } else {
          workloadMap.set(t.assigneeId, { name: t.assignee.fullName, count: 1 });
        }
      }
    }
    const teamWorkload = Array.from(workloadMap.entries())
      .map(([id, v]) => ({
        memberId: String(id),
        memberName: v.name,
        assignedTaskCount: v.count,
      }))
      .sort((a, b) => b.assignedTaskCount - a.assignedTaskCount);

    // 10. projects overview
    const projectsOverview = activeProjects.map((p) => {
      const pTasks = allTasks.filter((t) => t.projectId === p.id);
      return {
        id: String(p.id),
        name: p.name,
        totalTasks: pTasks.length,
        completedTasks: pTasks.filter((t) => t.status === TaskStatus.DONE).length,
      };
    });

    // 11. activity — recent activity across all user's projects
    const activity = await this.buildRecentActivity(activeProjectIds);

    return {
      stats: {
        activeProjects: activeProjects.length,
        openTasks: openTasks.length,
        completedThisSprint,
        overdueTasks,
      },
      sprint,
      tasksByStatus,
      tasksByPriority,
      weeklyTrend,
      myTasks,
      teamWorkload,
      projects: projectsOverview,
      activity,
    };
  }

  private mapStatus(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.TODO: return 'todo';
      case TaskStatus.IN_PROGRESS: return 'in_progress';
      case TaskStatus.IN_REVIEW: return 'in_progress';
      case TaskStatus.DONE: return 'done';
    }
  }

  private async buildWeeklyTrend(projectIds: number[]) {
    if (projectIds.length === 0) {
      return this.emptyWeeklyTrend();
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: { day: string; completed: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86_400_000);

      const count = await this.activityRepo
        .createQueryBuilder('al')
        .innerJoin('al.task', 'task')
        .where('task.projectId IN (:...projectIds)', { projectIds })
        .andWhere('al.action = :action', { action: 'status_changed' })
        .andWhere("al.details->>'toStatus' = :toStatus", { toStatus: 'DONE' })
        .andWhere('al.createdAt >= :dayStart', { dayStart })
        .andWhere('al.createdAt < :dayEnd', { dayEnd })
        .getCount();

      result.push({ day: dayNames[dayStart.getDay()], completed: count });
    }

    return result;
  }

  private async buildRecentActivity(projectIds: number[]) {
    if (projectIds.length === 0) return [];

    const entries = await this.activityRepo
      .createQueryBuilder('al')
      .innerJoinAndSelect('al.actor', 'actor')
      .innerJoin('al.task', 'task')
      .addSelect(['task.id', 'task.title'])
      .where('task.projectId IN (:...projectIds)', { projectIds })
      .orderBy('al.createdAt', 'DESC')
      .take(10)
      .getMany();

    return entries.map((e) => ({
      id: String(e.id),
      actorName: e.actor?.fullName || 'Unknown',
      action: this.mapActivityAction(e.action) as any,
      targetTitle: e.task?.title || '',
      timestamp: e.createdAt.toISOString(),
    }));
  }

  private mapActivityAction(action: string): 'moved' | 'completed' | 'created' | 'commented' {
    switch (action) {
      case 'status_changed': return 'moved';
      case 'comment_posted': return 'commented';
      default: return 'created';
    }
  }

  private emptyWeeklyTrend() {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: { day: string; completed: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      result.push({ day: dayNames[d.getDay()], completed: 0 });
    }
    return result;
  }

  private emptyDashboard() {
    return {
      stats: { activeProjects: 0, openTasks: 0, completedThisSprint: 0, overdueTasks: 0 },
      sprint: null,
      tasksByStatus: { todo: 0, in_progress: 0, done: 0 },
      tasksByPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
      weeklyTrend: this.emptyWeeklyTrend(),
      myTasks: [],
      teamWorkload: [],
      projects: [],
      activity: [],
    };
  }
}
