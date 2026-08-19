/**
 * Labels End-to-End Test Suite
 *
 * Tests:
 * - Create 3 project-scoped labels (Red, Blue, Green with colors)
 * - Attach 2 labels (Red, Blue) to a task
 * - Confirm task.labels has exactly 2 entries
 * - Detach Red → confirm only Blue remains
 * - Delete Blue → confirm task labels is empty
 *
 * Requires the backend to be running on http://localhost:3000.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { setToken, registerRequest } from '../common/lib/api';
import { createProject } from '../modules/project/api/projectsApi';
import { createTask, getTask, type TaskDto } from '../modules/task/api/tasksApi';
import {
  listLabels,
  createLabel,
  deleteLabel,
  attachLabel,
  detachLabel,
  type LabelDto,
} from '../modules/label/api/labelsApi';

/* ─── Helpers ────────────────────────────────────────────── */

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

/* ─── Test State ─────────────────────────────────────────── */

let token: string;
let projectId: number;
let task: TaskDto;
let labelRed: LabelDto;
let labelBlue: LabelDto;

/* ─── Setup ──────────────────────────────────────────────── */

beforeAll(async () => {
  const res = await registerRequest({
    email: uniqueEmail('label-tester'),
    password: 'password123',
    fullName: 'Label Tester',
  });
  token = res.accessToken;
  setToken(token);

  const project = await createProject({ name: 'Labels Test Project' });
  projectId = project.id;
  task = await createTask(project.id, { title: 'Labeled Task' });

  // Create 3 project-scoped labels
  labelRed = await createLabel(projectId, { name: 'Red', color: '#ef4444' });
  labelBlue = await createLabel(projectId, { name: 'Blue', color: '#3b82f6' });
  await createLabel(projectId, { name: 'Green', color: '#22c55e' });
});

/* ─── Tests ──────────────────────────────────────────────── */

describe('Labels — CRUD, attach, detach, cascade delete', () => {
  it('created 3 labels that appear in the project list', async () => {
    const labels = await listLabels(projectId);
    const names = labels.map((l) => l.name);
    expect(names).toContain('Red');
    expect(names).toContain('Blue');
    expect(names).toContain('Green');
  });

  it('attaching Red and Blue to a task shows 2 labels', async () => {
    await attachLabel(task.id, labelRed.id);
    await attachLabel(task.id, labelBlue.id);

    const updated = await getTask(task.id);
    expect(updated.labels).toHaveLength(2);
    const labelNames = updated.labels.map((l) => l.name).sort();
    expect(labelNames).toEqual(['Blue', 'Red']);
  });

  it('detaching Red leaves only Blue', async () => {
    await detachLabel(task.id, labelRed.id);

    const updated = await getTask(task.id);
    expect(updated.labels).toHaveLength(1);
    expect(updated.labels[0].name).toBe('Blue');
  });

  it('deleting Blue label cascades: task labels becomes empty', async () => {
    await deleteLabel(labelBlue.id);

    const updated = await getTask(task.id);
    expect(updated.labels).toHaveLength(0);

    // Also confirm it's gone from the project list
    const labels = await listLabels(projectId);
    expect(labels.find((l) => l.name === 'Blue')).toBeUndefined();
  });

  it('Green label still exists (not affected by Blue deletion)', async () => {
    const labels = await listLabels(projectId);
    expect(labels.find((l) => l.name === 'Green')).toBeDefined();
  });
});
