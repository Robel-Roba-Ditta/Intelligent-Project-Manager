/**
 * Workflow Enforcement End-to-End Test Suite
 *
 * Tests the task status state machine:
 * - Full lifecycle: TODO → IN_PROGRESS → IN_REVIEW → DONE
 * - Illegal transition: TODO → DONE → 400
 * - completedAt stamped on DONE, cleared on exit from DONE
 * - No-op: requesting current status returns 200 unchanged
 * - Generic PATCH /tasks/:id no longer accepts status changes
 *
 * Requires the backend to be running on http://localhost:3000.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { setToken, registerRequest, api } from '../lib/api';
import { createProject } from '../lib/projectsApi';
import {
  createTask,
  changeTaskStatus,
  getTask,
  type TaskDto,
} from '../lib/tasksApi';

/* ─── Helpers ────────────────────────────────────────────── */

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

/* ─── Test State ─────────────────────────────────────────── */

let token: string;
let task: TaskDto;

/* ─── Setup ──────────────────────────────────────────────── */

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

/* ─── Tests ──────────────────────────────────────────────── */

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

  it('DONE → IN_PROGRESS is allowed and clears completedAt', async () => {
    task = await changeTaskStatus(task.id, 'IN_PROGRESS');
    expect(task.status).toBe('IN_PROGRESS');
    expect(task.completedAt).toBeNull();
  });

  it('illegal transition TODO → DONE is rejected (400)', async () => {
    // First move back to TODO
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

  it('illegal transition TODO → IN_REVIEW is rejected (400)', async () => {
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
    // Sending status to the generic endpoint should either be rejected or silently ignored.
    // NestJS class-validator rejects it with 400 because `status` is not in UpdateTaskDto.
    try {
      await api.patch(`/tasks/${task.id}`, { status: 'DONE' });
    } catch {
      // Expected — status field is rejected by DTO validation
    }
    const after = await getTask(task.id);
    // Either way, the status must remain unchanged
    expect(after.status).toBe(before.status);
  });
});
