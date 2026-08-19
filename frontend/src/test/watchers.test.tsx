/**
 * Watchers End-to-End Test Suite
 *
 * Tests:
 * - Toggle watch on, verify status is watching
 * - Re-fetch status (simulates refresh), verify it persisted
 * - A different user on the same task sees "not watching"
 *
 * Requires the backend to be running on http://localhost:3000.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { setToken, registerRequest } from '../common/lib/api';
import { createProject, addProjectMember } from '../modules/project/api/projectsApi';
import { createTask, type TaskDto } from '../modules/task/api/tasksApi';
import { watchTask, unwatchTask, getWatchStatus } from '../modules/watcher/api/watchersApi';

/* ─── Helpers ────────────────────────────────────────────── */

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

/* ─── Test State ─────────────────────────────────────────── */

let token1: string;
let token2: string;
let task: TaskDto;

/* ─── Setup ──────────────────────────────────────────────── */

beforeAll(async () => {
  // Register user 1 (project owner)
  const res1 = await registerRequest({
    email: uniqueEmail('watch-u1'),
    password: 'password123',
    fullName: 'Watcher One',
  });
  token1 = res1.accessToken;

  // Register user 2
  const res2 = await registerRequest({
    email: uniqueEmail('watch-u2'),
    password: 'password123',
    fullName: 'Watcher Two',
  });
  token2 = res2.accessToken;

  // Create project as user 1
  setToken(token1);
  const project = await createProject({ name: 'Watcher Test Project' });

  // Add user 2 as member
  await addProjectMember(project.id, { email: res2.user.email, role: 'member' });

  // Create a task
  task = await createTask(project.id, { title: 'Watch Target Task' });
});

/* ─── Tests ──────────────────────────────────────────────── */

describe('Watchers', () => {
  it('initially user is not watching the task', async () => {
    setToken(token1);
    const status = await getWatchStatus(task.id);
    expect(status.watching).toBe(false);
  });

  it('toggling watch on returns watching: true', async () => {
    setToken(token1);
    const result = await watchTask(task.id);
    expect(result.watching).toBe(true);
  });

  it('re-fetching status persists as watching (simulates refresh)', async () => {
    setToken(token1);
    const status = await getWatchStatus(task.id);
    expect(status.watching).toBe(true);
  });

  it('a different user sees not-watching on the same task (per-user)', async () => {
    setToken(token2);
    const status = await getWatchStatus(task.id);
    expect(status.watching).toBe(false);
  });

  it('toggling watch off returns watching: false', async () => {
    setToken(token1);
    const result = await unwatchTask(task.id);
    expect(result.watching).toBe(false);
  });

  it('re-fetching after unwatch confirms persistence', async () => {
    setToken(token1);
    const status = await getWatchStatus(task.id);
    expect(status.watching).toBe(false);
  });
});
