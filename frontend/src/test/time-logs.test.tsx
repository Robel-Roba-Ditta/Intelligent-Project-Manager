/**
 * Time Logs End-to-End Test Suite
 *
 * Tests:
 * - Log two entries (2h + 3.5h) against the same task
 * - Confirm totalHours equals 5.5
 * - Confirm both entries are listed
 *
 * Requires the backend to be running on http://localhost:3000.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { setToken, registerRequest } from '../lib/api';
import { createProject } from '../lib/projectsApi';
import { createTask, type TaskDto } from '../lib/tasksApi';
import { createTimeLog, listTimeLogs } from '../lib/timeLogsApi';

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
    email: uniqueEmail('timelog'),
    password: 'password123',
    fullName: 'Time Logger',
  });
  token = res.accessToken;
  setToken(token);

  const project = await createProject({ name: 'Time Logs Test Project' });
  task = await createTask(project.id, { title: 'Time Logs Task' });

  // Log two entries with different hours
  await createTimeLog(task.id, { hours: 2, date: '2026-01-10' });
  await createTimeLog(task.id, { hours: 3.5, date: '2026-01-11' });
});

/* ─── Tests ──────────────────────────────────────────────── */

describe('Time Logs', () => {
  it('totalHours is the exact sum of the two entries (5.5)', async () => {
    setToken(token);
    const data = await listTimeLogs(task.id);
    expect(data.totalHours).toBe(5.5);
  });

  it('both individual entries are listed', async () => {
    setToken(token);
    const data = await listTimeLogs(task.id);
    expect(data.entries.length).toBeGreaterThanOrEqual(2);
    const hours = data.entries.map((e) => Number(e.hours));
    expect(hours).toContain(2);
    expect(hours).toContain(3.5);
  });

  it('entries are ordered newest first', async () => {
    setToken(token);
    const data = await listTimeLogs(task.id);
    // First entry should have createdAt >= second entry
    const t0 = new Date(data.entries[0].createdAt).getTime();
    const t1 = new Date(data.entries[1].createdAt).getTime();
    expect(t0).toBeGreaterThanOrEqual(t1);
  });

  it('each entry has a user attribution', async () => {
    setToken(token);
    const data = await listTimeLogs(task.id);
    for (const entry of data.entries) {
      expect(entry.user).toBeDefined();
      expect(entry.user.fullName).toBe('Time Logger');
    }
  });
});
