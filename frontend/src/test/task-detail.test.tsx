/**
 * Task Detail End-to-End Test Suite
 *
 * Tests:
 * - Task has all fields populated (title, description, status, priority, type, etc.)
 * - Status change via changeTaskStatus (workflow endpoint)
 * - Priority and assignee update via updateTask (generic endpoint)
 * - Subtask creation and parent-child link
 * - Labels attach from detail view
 *
 * Requires the backend to be running on http://localhost:3000.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { setToken, registerRequest, type AuthUser } from '../common/lib/api';
import {
  createProject,
  addProjectMember,
  type ProjectDto,
} from '../modules/project/api/projectsApi';
import { createEpic, type EpicDto } from '../modules/epic/api/epicsApi';
import { createSprint, type SprintDto } from '../modules/sprint/api/sprintsApi';
import {
  createTask,
  getTask,
  updateTask,
  changeTaskStatus,
  type TaskDto,
} from '../modules/task/api/tasksApi';
import { createLabel, attachLabel, type LabelDto } from '../modules/label/api/labelsApi';

/* ─── Helpers ────────────────────────────────────────────── */

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

/* ─── Test State ─────────────────────────────────────────── */

let user1: AuthUser;
let user2: AuthUser;
let token: string;
let project: ProjectDto;
let epic: EpicDto;
let sprint: SprintDto;
let task: TaskDto;
let label: LabelDto;

/* ─── Setup ──────────────────────────────────────────────── */

beforeAll(async () => {
  const res1 = await registerRequest({
    email: uniqueEmail('detail-user1'),
    password: 'password123',
    fullName: 'Detail User One',
  });
  user1 = res1.user;
  token = res1.accessToken;
  setToken(token);

  const res2 = await registerRequest({
    email: uniqueEmail('detail-user2'),
    password: 'password123',
    fullName: 'Detail User Two',
  });
  user2 = res2.user;

  project = await createProject({ name: 'Detail Test Project' });
  project = await addProjectMember(project.id, { email: res2.user.email, role: 'member' });

  epic = await createEpic(project.id, { name: 'Detail Epic' });
  sprint = await createSprint(project.id, { name: 'Detail Sprint' });

  task = await createTask(project.id, {
    title: 'Full Detail Task',
    description: 'A detailed description for testing.',
    priority: 'HIGH',
    type: 'BUG',
    storyPoints: 8,
    assigneeId: user1.id,
    epicId: epic.id,
    sprintId: sprint.id,
  });

  label = await createLabel(project.id, { name: 'DetailLabel', color: '#8b5cf6' });
});

/* ─── Tests ──────────────────────────────────────────────── */

describe('Task Detail — fields, edits, subtasks', () => {
  it('fetched task has all fields populated', () => {
    expect(task.title).toBe('Full Detail Task');
    expect(task.description).toBe('A detailed description for testing.');
    expect(task.status).toBe('TODO');
    expect(task.priority).toBe('HIGH');
    expect(task.type).toBe('BUG');
    expect(task.storyPoints).toBe(8);
    expect(task.assigneeId).toBe(user1.id);
    expect(task.assignee).toBeDefined();
    expect(task.assignee!.fullName).toBe('Detail User One');
    expect(task.epicId).toBe(epic.id);
    expect(task.epic!.name).toBe('Detail Epic');
    expect(task.sprintId).toBe(sprint.id);
    expect(task.sprint!.name).toBe('Detail Sprint');
    expect(task.labels).toBeDefined();
    expect(Array.isArray(task.labels)).toBe(true);
  });

  it('status change via changeTaskStatus (workflow endpoint) works', async () => {
    task = await changeTaskStatus(task.id, 'IN_PROGRESS');
    expect(task.status).toBe('IN_PROGRESS');
    expect(task.completedAt).toBeNull();

    task = await changeTaskStatus(task.id, 'IN_REVIEW');
    expect(task.status).toBe('IN_REVIEW');

    task = await changeTaskStatus(task.id, 'DONE');
    expect(task.status).toBe('DONE');
    expect(task.completedAt).not.toBeNull();
  });

  it('priority update via generic updateTask works', async () => {
    task = await updateTask(task.id, { priority: 'LOW' });
    expect(task.priority).toBe('LOW');
  });

  it('assignee update via generic updateTask works', async () => {
    await updateTask(task.id, { assigneeId: user2.id });
    task = await getTask(task.id);
    expect(task.assigneeId).toBe(user2.id);
    expect(task.assignee!.fullName).toBe('Detail User Two');
  });

  it('creating a subtask appears in parent children', async () => {
    const subtask = await createTask(project.id, {
      title: 'Detail Subtask',
      parentTaskId: task.id,
    });
    expect(subtask.parentTaskId).toBe(task.id);

    // Re-fetch parent
    const parent = await getTask(task.id);
    expect(parent.children.length).toBeGreaterThanOrEqual(1);
    const found = parent.children.find((c) => c.id === subtask.id);
    expect(found).toBeDefined();
    expect(found!.title).toBe('Detail Subtask');
  });

  it('attaching a label from the detail view works', async () => {
    await attachLabel(task.id, label.id);
    const updated = await getTask(task.id);
    expect(updated.labels).toHaveLength(1);
    expect(updated.labels[0].name).toBe('DetailLabel');
    expect(updated.labels[0].color).toBe('#8b5cf6');
  });

  it('changes are reflected when re-fetching the task', async () => {
    const fresh = await getTask(task.id);
    // All the mutations from previous tests should be persisted
    expect(fresh.status).toBe('DONE');
    expect(fresh.priority).toBe('LOW');
    expect(fresh.assignee!.fullName).toBe('Detail User Two');
    expect(fresh.children.length).toBeGreaterThanOrEqual(1);
    expect(fresh.labels.length).toBeGreaterThanOrEqual(1);
  });
});
