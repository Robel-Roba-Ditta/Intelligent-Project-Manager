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
import { setToken, registerRequest, api } from '../common/lib/api';
import { createProject } from '../modules/project/api/projectsApi';
import {
  createTask,
  changeTaskStatus,
  getTask,
  type TaskDto,
} from '../modules/task/api/tasksApi';

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

  it('DONE → IN_REVIEW is allowed and clears completedAt', async () => {
    task = await changeTaskStatus(task.id, 'IN_REVIEW');
    expect(task.status).toBe('IN_REVIEW');
    expect(task.completedAt).toBeNull();
  });

  it('illegal transition TODO → DONE is rejected (400)', async () => {
    // Move back to TODO: IN_REVIEW → IN_PROGRESS → TODO
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
    // Move to IN_PROGRESS
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
    // Task is in IN_PROGRESS after the previous test.
    // Move IN_PROGRESS → TODO to create a recorded change.
    task = await changeTaskStatus(task.id, 'TODO');

    // Small delay for async event
    await new Promise((r) => setTimeout(r, 100));

    const { data: activity } = await api.get(`/tasks/${task.id}/activity`);
    expect(Array.isArray(activity)).toBe(true);
    // Find the status_changed entry
    const statusEntries = activity.filter((e: any) => e.action === 'status_changed');
    expect(statusEntries.length).toBeGreaterThanOrEqual(1);
    const last = statusEntries[statusEntries.length - 1];
    expect(last.details.fromStatus).toBe('IN_PROGRESS');
    expect(last.details.toStatus).toBe('TODO');
    expect(last.actor).toBeDefined();
  });

  it('illegal transition TODO → IN_REVIEW is rejected (400)', async () => {
    // Task is in TODO after the activity test
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
