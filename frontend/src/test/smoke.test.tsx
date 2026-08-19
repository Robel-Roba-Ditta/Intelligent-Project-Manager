/**
 * Smoke Test Suite — Happy-Path End-to-End
 *
 * 8-step journey covering the critical path through the entire application.
 * Any failure here is a deploy-blocker — it means a fundamental feature
 * is broken, not just an edge case.
 *
 * Requires the backend to be running on http://localhost:3000.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { setToken, registerRequest, api } from '../lib/api';
import { createProject, addProjectMember, type ProjectDto } from '../lib/projectsApi';
import { createTask, changeTaskStatus, type TaskDto } from '../lib/tasksApi';
import { createEpic } from '../lib/epicsApi';
import { createSprint, startSprint, type SprintDto } from '../lib/sprintsApi';
import { createComment } from '../lib/commentsApi';
import { listNotifications } from '../lib/notificationsApi';

function uniqueEmail(prefix: string) {
  return `${prefix}-smoke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

let tokenA: string;
let tokenB: string;
let userBEmail: string;
let project: ProjectDto;
let task: TaskDto;

describe('Smoke test — critical path', () => {
  // ── Step 1: Register user A, login ──────────────────────
  it('1. Register user A and get a token', async () => {
    const res = await registerRequest({
      email: uniqueEmail('smoke-a'),
      password: 'password123',
      fullName: 'Smoke User A',
    });
    tokenA = res.accessToken;
    expect(tokenA).toBeTruthy();
    setToken(tokenA);
  });

  // ── Step 2: Create a project ────────────────────────────
  it('2. Create a project and verify it exists', async () => {
    setToken(tokenA);
    project = await createProject({ name: 'Smoke Test Project' });
    expect(project.id).toBeDefined();
    expect(project.name).toBe('Smoke Test Project');
  });

  // ── Step 3: Register user B, add as member ──────────────
  it('3. Add a second member to the project', async () => {
    userBEmail = uniqueEmail('smoke-b');
    const resB = await registerRequest({
      email: userBEmail,
      password: 'password123',
      fullName: 'Smoke User B',
    });
    tokenB = resB.accessToken;

    setToken(tokenA);
    const updated = await addProjectMember(project.id, {
      email: userBEmail,
      role: 'member',
    });
    const memberEmails = updated.members.map((m: any) => m.user?.email);
    expect(memberEmails).toContain(userBEmail);
  });

  // ── Step 4: Create epic, sprint, task ──────────────────
  it('4. Create an epic, sprint, and assigned task', async () => {
    setToken(tokenA);

    const epic = await createEpic(project.id, { name: 'Smoke Epic' });
    expect(epic.id).toBeDefined();

    const sprint = await createSprint(project.id, { name: 'Smoke Sprint' });
    expect(sprint.id).toBeDefined();

    // Find user B's id from project members
    const { data: projData } = await api.get(`/projects/${project.id}`);
    const memberB = projData.members.find((m: any) => m.user?.email === userBEmail);
    expect(memberB).toBeDefined();

    task = await createTask(project.id, {
      title: 'Smoke Task',
      epicId: epic.id,
      sprintId: sprint.id,
      assigneeId: memberB.userId,
    });
    expect(task.id).toBeDefined();
    expect(task.assigneeId).toBe(memberB.userId);
  });

  // ── Step 5: Move task through the board ─────────────────
  it('5. Move task TODO → IN_PROGRESS → IN_REVIEW → DONE', async () => {
    setToken(tokenA);

    task = await changeTaskStatus(task.id, 'IN_PROGRESS');
    expect(task.status).toBe('IN_PROGRESS');

    task = await changeTaskStatus(task.id, 'IN_REVIEW');
    expect(task.status).toBe('IN_REVIEW');

    task = await changeTaskStatus(task.id, 'DONE');
    expect(task.status).toBe('DONE');
    expect(task.completedAt).not.toBeNull();
  });

  // ── Step 6: Post a comment ──────────────────────────────
  it('6. Post a comment on the task', async () => {
    setToken(tokenA);
    const comment = await createComment(task.id, 'Smoke test comment');
    expect(comment.body).toBe('Smoke test comment');
  });

  // ── Step 7: Dashboard loads with non-zero count ─────────
  it('7. Dashboard shows non-zero project count', async () => {
    setToken(tokenA);
    const { data } = await api.get('/dashboard');
    expect(data.stats.activeProjects).toBeGreaterThanOrEqual(1);
    expect(data.projects.length).toBeGreaterThanOrEqual(1);
  });

  // ── Step 8: User B sees the assignment notification ─────
  it('8. User B has the assignment notification', async () => {
    setToken(tokenB);

    // Small delay for async event processing
    await new Promise((r) => setTimeout(r, 800));

    const data = await listNotifications();
    expect(data.notifications.length).toBeGreaterThanOrEqual(1);

    const assignNotif = data.notifications.find((n: any) =>
      n.type === 'assigned' && n.message.includes('Smoke Task'),
    );
    expect(assignNotif).toBeDefined();
  });
});
