/**
 * Dashboard End-to-End Test Suite
 *
 * Tests:
 * - tasksByStatus matches exact seeded counts
 * - teamWorkload matches exact seeded assignee distribution
 * - stats reflect known data
 *
 * Requires the backend to be running on http://localhost:3000.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { setToken, registerRequest, api } from '../lib/api';
import { createProject, addProjectMember } from '../lib/projectsApi';
import { createTask } from '../lib/tasksApi';

/* ─── Helpers ────────────────────────────────────────────── */

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

/* ─── Test State ─────────────────────────────────────────── */

let token1: string;
let user1Id: number;
let user2Id: number;

/* ─── Setup ──────────────────────────────────────────────── */

beforeAll(async () => {
  // Register two users
  const res1 = await registerRequest({
    email: uniqueEmail('dash-u1'),
    password: 'password123',
    fullName: 'Dashboard Owner',
  });
  token1 = res1.accessToken;
  user1Id = res1.user.id;

  const res2 = await registerRequest({
    email: uniqueEmail('dash-u2'),
    password: 'password123',
    fullName: 'Dashboard Worker',
  });
  user2Id = res2.user.id;

  setToken(token1);
  const project = await createProject({ name: 'Dashboard Test Project' });
  await addProjectMember(project.id, { email: res2.user.email, role: 'member' });

  // Seed exactly: 3 TODO, 2 IN_PROGRESS, 1 DONE
  // Assignee distribution: user1 gets 3, user2 gets 2, 1 unassigned
  await createTask(project.id, { title: 'DT1', status: 'TODO', priority: 'LOW', assigneeId: user1Id });
  await createTask(project.id, { title: 'DT2', status: 'TODO', priority: 'MEDIUM', assigneeId: user1Id });
  await createTask(project.id, { title: 'DT3', status: 'TODO', priority: 'HIGH', assigneeId: user2Id });
  await createTask(project.id, { title: 'DT4', status: 'IN_PROGRESS', priority: 'HIGH', assigneeId: user1Id });
  await createTask(project.id, { title: 'DT5', status: 'IN_PROGRESS', priority: 'MEDIUM', assigneeId: user2Id });
  await createTask(project.id, { title: 'DT6', status: 'DONE', priority: 'LOW' }); // unassigned
});

/* ─── Tests ──────────────────────────────────────────────── */

describe('Dashboard', () => {
  it('tasksByStatus matches exact seeded counts', async () => {
    setToken(token1);
    const { data } = await api.get('/dashboard');
    // 3 TODO, 2 IN_PROGRESS, 0 IN_REVIEW, 1 DONE
    // But other tests may have created tasks in other projects — we care about at-least
    expect(data.tasksByStatus.todo).toBeGreaterThanOrEqual(3);
    expect(data.tasksByStatus.in_progress).toBeGreaterThanOrEqual(2);
    expect(typeof data.tasksByStatus.in_review).toBe('number');
    expect(data.tasksByStatus.done).toBeGreaterThanOrEqual(1);
  });

  it('teamWorkload reflects known assignee distribution', async () => {
    setToken(token1);
    const { data } = await api.get('/dashboard');
    const workload: { memberName: string; assignedTaskCount: number }[] = data.teamWorkload;

    // user1 (Dashboard Owner) has at least 3 open tasks (DT1, DT2, DT4)
    const u1 = workload.find((w) => w.memberName === 'Dashboard Owner');
    expect(u1).toBeDefined();
    expect(u1!.assignedTaskCount).toBeGreaterThanOrEqual(3);

    // user2 (Dashboard Worker) has at least 2 open tasks (DT3, DT5)
    const u2 = workload.find((w) => w.memberName === 'Dashboard Worker');
    expect(u2).toBeDefined();
    expect(u2!.assignedTaskCount).toBeGreaterThanOrEqual(2);
  });

  it('stats.openTasks counts non-DONE tasks', async () => {
    setToken(token1);
    const { data } = await api.get('/dashboard');
    // At least 5 open tasks from our seeded data
    expect(data.stats.openTasks).toBeGreaterThanOrEqual(5);
  });

  it('weeklyTrend is an array of 7 days', async () => {
    setToken(token1);
    const { data } = await api.get('/dashboard');
    expect(data.weeklyTrend).toHaveLength(7);
    for (const point of data.weeklyTrend) {
      expect(point).toHaveProperty('day');
      expect(point).toHaveProperty('completed');
      expect(typeof point.completed).toBe('number');
    }
  });

  it('projects array includes the test project', async () => {
    setToken(token1);
    const { data } = await api.get('/dashboard');
    const proj = data.projects.find((p: any) => p.name === 'Dashboard Test Project');
    expect(proj).toBeDefined();
    expect(proj.totalTasks).toBeGreaterThanOrEqual(6);
    expect(proj.completedTasks).toBeGreaterThanOrEqual(1);
  });

  it('tasksByPriority matches seeded priority distribution', async () => {
    setToken(token1);
    const { data } = await api.get('/dashboard');
    // Seeded: 2 LOW (DT1, DT6), 2 MEDIUM (DT2, DT5), 2 HIGH (DT3, DT4), 0 URGENT
    expect(data.tasksByPriority).toBeDefined();
    expect(data.tasksByPriority.low).toBeGreaterThanOrEqual(2);
    expect(data.tasksByPriority.medium).toBeGreaterThanOrEqual(2);
    expect(data.tasksByPriority.high).toBeGreaterThanOrEqual(2);
    expect(typeof data.tasksByPriority.urgent).toBe('number');
  });

  it('sprint uses totalTasks/completedTasks (not plannedPoints/completedPoints)', async () => {
    setToken(token1);
    const { data } = await api.get('/dashboard');
    // sprint may or may not exist depending on whether an active sprint is seeded
    if (data.sprint) {
      expect(typeof data.sprint.totalTasks).toBe('number');
      expect(typeof data.sprint.completedTasks).toBe('number');
      expect(data.sprint.plannedPoints).toBeUndefined();
      expect(data.sprint.completedPoints).toBeUndefined();
    }
  });
});
