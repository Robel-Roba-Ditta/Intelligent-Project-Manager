import { describe, it, expect, beforeAll } from 'vitest';
import { setToken, registerRequest, api } from '../common/lib/api';
import { createProject } from '../modules/project/api/projectsApi';
import {
  createTask,
  changeTaskStatus,
  getTask,
  type TaskDto,
} from '../modules/task/api/tasksApi';


function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}


let token: string;
let task: TaskDto;


beforeAll(async () => {
  const res = await registerRequest({
    email: uniqueEmail('workflow'),
    password: 'password123',
    fullName: 'Workflow Tester',
  });
  token = res.accessToken;
  setToken(token);

  const project = await createProject({ name: 'Workflow Test Project' });
  task = await createTask(project.id, { title: 'Workflow Task' });
});


describe('Workflow — status transitions', () => {
  it('task starts in TODO status', () => {
    expect(task.status).toBe('TODO');
    expect(task.completedAt).toBeNull();
  });

  it('TODO → IN_PROGRESS is allowed', async () => {
    task = await changeTaskStatus(task.id, 'IN_PROGRESS');
    expect(task.status).toBe('IN_PROGRESS');
    expect(task.completedAt).toBeNull();
  });

  it('IN_PROGRESS → IN_REVIEW is allowed', async () => {
    task = await changeTaskStatus(task.id, 'IN_REVIEW');
    expect(task.status).toBe('IN_REVIEW');
  });

  it('IN_REVIEW → DONE is allowed and stamps completedAt', async () => {
    task = await changeTaskStatus(task.id, 'DONE');
    expect(task.status).toBe('DONE');
    expect(task.completedAt).not.toBeNull();
  });

  it('requesting the current status is a no-op (200)', async () => {
    const unchanged = await changeTaskStatus(task.id, 'DONE');
    expect(unchanged.status).toBe('DONE');
    expect(unchanged.completedAt).not.toBeNull();
  });

  it('DONE → IN_REVIEW is allowed and clears completedAt', async () => {
    task = await changeTaskStatus(task.id, 'IN_REVIEW');
    expect(task.status).toBe('IN_REVIEW');
    expect(task.completedAt).toBeNull();
  });

  it('illegal transition TODO → DONE is rejected (400)', async () => {
    task = await changeTaskStatus(task.id, 'IN_PROGRESS');
    task = await changeTaskStatus(task.id, 'TODO');
    expect(task.status).toBe('TODO');

    try {
      await changeTaskStatus(task.id, 'DONE');
      expect.unreachable('Should not allow TODO → DONE');
    } catch (err: any) {
      expect(err.response?.status).toBe(400);
      expect(err.response?.data?.message).toMatch(/Cannot move/i);
    }
  });

  it('illegal transition IN_PROGRESS → DONE is rejected (400)', async () => {
    task = await changeTaskStatus(task.id, 'IN_PROGRESS');
    expect(task.status).toBe('IN_PROGRESS');

    try {
      await changeTaskStatus(task.id, 'DONE');
      expect.unreachable('Should not allow IN_PROGRESS → DONE');
    } catch (err: any) {
      expect(err.response?.status).toBe(400);
      expect(err.response?.data?.message).toMatch(/Cannot move/i);
    }
  });

  it('status changes are recorded in the activity log', async () => {
    task = await changeTaskStatus(task.id, 'TODO');

    await new Promise((r) => setTimeout(r, 100));

    const { data: activity } = await api.get(`/tasks/${task.id}/activity`);
    expect(Array.isArray(activity)).toBe(true);
    const statusEntries = activity.filter((e: any) => e.action === 'status_changed');
    expect(statusEntries.length).toBeGreaterThanOrEqual(1);
    const last = statusEntries[statusEntries.length - 1];
    expect(last.details.fromStatus).toBe('IN_PROGRESS');
    expect(last.details.toStatus).toBe('TODO');
    expect(last.actor).toBeDefined();
  });

  it('illegal transition TODO → IN_REVIEW is rejected (400)', async () => {
    expect(task.status).toBe('TODO');

    try {
      await changeTaskStatus(task.id, 'IN_REVIEW');
      expect.unreachable('Should not allow TODO → IN_REVIEW');
    } catch (err: any) {
      expect(err.response?.status).toBe(400);
      expect(err.response?.data?.message).toMatch(/Cannot move/i);
    }
  });

  it('generic PATCH /tasks/:id no longer accepts status changes', async () => {
    const before = await getTask(task.id);
    try {
      await api.patch(`/tasks/${task.id}`, { status: 'DONE' });
    } catch {
    }
    const after = await getTask(task.id);
    expect(after.status).toBe(before.status);
  });
});
