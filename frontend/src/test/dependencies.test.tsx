/**
 * Task Dependencies End-to-End Test Suite
 *
 * Tests:
 * - Link A blocks B via a single API call
 * - Task A lists "Blocks: B"
 * - Task B lists "Blocked by: A"
 * - Attempting the reverse "B blocks A" is rejected (direct cycle)
 *
 * Requires the backend to be running on http://localhost:3000.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { setToken, registerRequest } from '../lib/api';
import { createProject } from '../lib/projectsApi';
import { createTask, type TaskDto } from '../lib/tasksApi';
import { createDependency, listDependencies } from '../lib/dependenciesApi';

/* ─── Helpers ────────────────────────────────────────────── */

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

/* ─── Test State ─────────────────────────────────────────── */

let token: string;
let taskA: TaskDto;
let taskB: TaskDto;

/* ─── Setup ──────────────────────────────────────────────── */

beforeAll(async () => {
  const res = await registerRequest({
    email: uniqueEmail('deps'),
    password: 'password123',
    fullName: 'Dependency Tester',
  });
  token = res.accessToken;
  setToken(token);

  const project = await createProject({ name: 'Dependency Test Project' });
  taskA = await createTask(project.id, { title: 'Task A (blocker)' });
  taskB = await createTask(project.id, { title: 'Task B (blocked)' });

  // One single API call: A blocks B
  await createDependency(taskA.id, taskB.id);
});

/* ─── Tests ──────────────────────────────────────────────── */

describe('Task Dependencies', () => {
  it('Task A lists "Blocks: B"', async () => {
    setToken(token);
    const deps = await listDependencies(taskA.id);
    expect(deps.blocks.length).toBeGreaterThanOrEqual(1);
    const found = deps.blocks.find((d) => d.task.id === taskB.id);
    expect(found).toBeDefined();
    expect(found!.task.title).toBe('Task B (blocked)');
  });

  it('Task B lists "Blocked by: A"', async () => {
    setToken(token);
    const deps = await listDependencies(taskB.id);
    expect(deps.blockedBy.length).toBeGreaterThanOrEqual(1);
    const found = deps.blockedBy.find((d) => d.task.id === taskA.id);
    expect(found).toBeDefined();
    expect(found!.task.title).toBe('Task A (blocker)');
  });

  it('both derived from a single write (no duplicates)', async () => {
    setToken(token);
    const depsA = await listDependencies(taskA.id);
    const depsB = await listDependencies(taskB.id);
    // A blocks B is one row
    expect(depsA.blocks.length).toBe(1);
    expect(depsB.blockedBy.length).toBe(1);
    // The dependency IDs should match
    expect(depsA.blocks[0].dependencyId).toBe(depsB.blockedBy[0].dependencyId);
  });

  it('reverse "B blocks A" is rejected (direct cycle)', async () => {
    setToken(token);
    try {
      await createDependency(taskB.id, taskA.id);
      expect.unreachable('Should not allow B → A when A → B exists');
    } catch (err: any) {
      expect(err.response?.status).toBe(400);
      expect(err.response?.data?.message).toMatch(/reverse|cycle/i);
    }
  });
});
