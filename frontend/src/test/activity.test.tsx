/**
 * Activity Log End-to-End Test Suite
 *
 * Tests:
 * - Perform 4 distinct actions in order: status change, assignee change, comment, time log
 * - Confirm all 4 activity entries appear in the correct order
 * - Each entry correctly describes what happened (not generic)
 *
 * Requires the backend to be running on http://localhost:3000.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { setToken, registerRequest, type AuthUser } from '../lib/api';
import { createProject, addProjectMember } from '../lib/projectsApi';
import { createTask, changeTaskStatus, type TaskDto } from '../lib/tasksApi';
import { listActivity, type ActivityLogDto } from '../lib/activityApi';
import { createComment } from '../lib/commentsApi';
import { createTimeLog } from '../lib/timeLogsApi';
import { updateTask } from '../lib/tasksApi';

/* ─── Helpers ────────────────────────────────────────────── */

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

/* ─── Test State ─────────────────────────────────────────── */

let token1: string;
let user2: AuthUser;
let task: TaskDto;
let activity: ActivityLogDto[];

/* ─── Setup ──────────────────────────────────────────────── */

beforeAll(async () => {
  // Register two users
  const res1 = await registerRequest({
    email: uniqueEmail('activity-u1'),
    password: 'password123',
    fullName: 'Activity Actor',
  });
  token1 = res1.accessToken;

  const res2 = await registerRequest({
    email: uniqueEmail('activity-u2'),
    password: 'password123',
    fullName: 'Activity Assignee',
  });
  user2 = res2.user;

  setToken(token1);
  const project = await createProject({ name: 'Activity Test Project' });
  await addProjectMember(project.id, { email: res2.user.email, role: 'member' });

  task = await createTask(project.id, { title: 'Activity Target Task' });

  // Small delays to ensure ordering
  // Action 1: status change
  await changeTaskStatus(task.id, 'IN_PROGRESS');
  await new Promise((r) => setTimeout(r, 100));

  // Action 2: assignee change
  await updateTask(task.id, { assigneeId: user2.id });
  await new Promise((r) => setTimeout(r, 100));

  // Action 3: comment
  await createComment(task.id, 'Test activity comment');
  await new Promise((r) => setTimeout(r, 100));

  // Action 4: time log
  await createTimeLog(task.id, { hours: 2, date: '2026-06-01' });
  await new Promise((r) => setTimeout(r, 100));

  // Fetch activity
  activity = await listActivity(task.id);
});

/* ─── Tests ──────────────────────────────────────────────── */

describe('Activity Log', () => {
  it('all 4 activity entries appear', () => {
    const actions = activity.map((e) => e.action);
    expect(actions).toContain('status_changed');
    expect(actions).toContain('assignee_changed');
    expect(actions).toContain('comment_posted');
    expect(actions).toContain('time_logged');
  });

  it('entries are in chronological order (same as the actions were performed)', () => {
    const actions = activity.map((e) => e.action);
    const statusIdx = actions.indexOf('status_changed');
    const assigneeIdx = actions.indexOf('assignee_changed');
    const commentIdx = actions.indexOf('comment_posted');
    const timeIdx = actions.indexOf('time_logged');
    expect(statusIdx).toBeLessThan(assigneeIdx);
    expect(assigneeIdx).toBeLessThan(commentIdx);
    expect(commentIdx).toBeLessThan(timeIdx);
  });

  it('status_changed entry describes the actual from/to', () => {
    const entry = activity.find((e) => e.action === 'status_changed')!;
    expect(entry.details.fromStatus).toBe('TODO');
    expect(entry.details.toStatus).toBe('IN_PROGRESS');
  });

  it('assignee_changed entry describes the change', () => {
    const entry = activity.find((e) => e.action === 'assignee_changed')!;
    expect(entry.details.toAssigneeId).toBe(user2.id);
  });

  it('comment_posted entry has a commentId', () => {
    const entry = activity.find((e) => e.action === 'comment_posted')!;
    expect(entry.details.commentId).toBeDefined();
    expect(typeof entry.details.commentId).toBe('number');
  });

  it('time_logged entry describes the hours logged', () => {
    const entry = activity.find((e) => e.action === 'time_logged')!;
    expect(entry.details.hours).toBe(2);
    expect(entry.details.date).toBe('2026-06-01');
  });

  it('each entry has an actor with a fullName', () => {
    for (const entry of activity) {
      expect(entry.actor).toBeDefined();
      expect(entry.actor.fullName).toBeDefined();
    }
  });
});
