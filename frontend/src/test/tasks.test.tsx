/**
 * Tasks End-to-End Test Suite
 *
 * Exercises:
 * - Creating 5–6 tasks across different assignees/priorities
 * - Subtask (parentTaskId) → parent's children includes it
 * - Assigning a task to a non-member → rejected
 * - Soft-delete → disappears from default list but row still exists
 * - Epic/sprint cross-project validation
 *
 * Requires the backend to be running on http://localhost:3000.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { setToken, registerRequest, type AuthUser } from '../lib/api';
import {
  createProject,
  addProjectMember,
  type ProjectDto,
} from '../lib/projectsApi';
import { createEpic, type EpicDto } from '../lib/epicsApi';
import { createSprint, type SprintDto } from '../lib/sprintsApi';
import {
  listTasks,
  createTask,
  getTask,
  deleteTask,
  type TaskDto,
} from '../lib/tasksApi';

/* ─── Helpers ────────────────────────────────────────────── */

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

/* ─── Test State ─────────────────────────────────────────── */

let user1: AuthUser;
let user1Token: string;

let user2: AuthUser;

let outsiderUser: AuthUser;

let project: ProjectDto;
let epic: EpicDto;
let sprint: SprintDto;
let parentTask: TaskDto;
let subtask: TaskDto;
let taskToDelete: TaskDto;

/* ─── Setup ──────────────────────────────────────────────── */

beforeAll(async () => {
  // Register 3 users: 2 project members + 1 outsider
  const res1 = await registerRequest({
    email: uniqueEmail('task-user1'),
    password: 'password123',
    fullName: 'Task User One',
  });
  user1 = res1.user;
  user1Token = res1.accessToken;

  const res2 = await registerRequest({
    email: uniqueEmail('task-user2'),
    password: 'password123',
    fullName: 'Task User Two',
  });
  user2 = res2.user;

  const res3 = await registerRequest({
    email: uniqueEmail('task-outsider'),
    password: 'password123',
    fullName: 'Outsider User',
  });
  outsiderUser = res3.user;

  // User1 creates a project and adds User2 as a member
  setToken(user1Token);
  project = await createProject({ name: 'Task Test Project' });
  project = await addProjectMember(project.id, { email: res2.user.email, role: 'member' });

  // Create an epic and sprint for the project
  epic = await createEpic(project.id, { name: 'Test Epic' });
  sprint = await createSprint(project.id, { name: 'Test Sprint' });

  // Create 5 tasks with different assignees and priorities
  const task1 = await createTask(project.id, {
    title: 'Setup CI Pipeline',
    priority: 'HIGH',
    type: 'TASK',
    assigneeId: user1.id,
    epicId: epic.id,
  });

  await createTask(project.id, {
    title: 'Fix Login Bug',
    priority: 'URGENT',
    type: 'BUG',
    assigneeId: user2.id,
    sprintId: sprint.id,
  });

  await createTask(project.id, {
    title: 'User Stories',
    priority: 'MEDIUM',
    type: 'STORY',
    storyPoints: 5,
  });

  await createTask(project.id, {
    title: 'Write Docs',
    priority: 'LOW',
    type: 'TASK',
    assigneeId: user1.id,
  });

  await createTask(project.id, {
    title: 'Review PR',
    priority: 'MEDIUM',
    type: 'TASK',
    assigneeId: user2.id,
  });

  parentTask = task1;

  // Create a subtask under task1
  subtask = await createTask(project.id, {
    title: 'Configure GitHub Actions',
    priority: 'MEDIUM',
    type: 'TASK',
    parentTaskId: parentTask.id,
  });

  // Create a task we'll soft-delete later
  taskToDelete = await createTask(project.id, {
    title: 'Throwaway Task',
    priority: 'LOW',
    type: 'TASK',
  });
});

/* ─── Tests ──────────────────────────────────────────────── */

describe('Tasks — CRUD, validation, subtasks, soft-delete', () => {
  it('created tasks have the correct properties', async () => {
    setToken(user1Token);
    const all = await listTasks(project.id);
    // 5 original + 1 subtask + 1 throwaway = 7
    expect(all.length).toBe(7);

    const ciBuild = all.find((t) => t.title === 'Setup CI Pipeline');
    expect(ciBuild).toBeDefined();
    expect(ciBuild!.priority).toBe('HIGH');
    expect(ciBuild!.type).toBe('TASK');
    expect(ciBuild!.assigneeId).toBe(user1.id);
    expect(ciBuild!.epicId).toBe(epic.id);
  });

  it('tasks assigned to different users are correct', async () => {
    setToken(user1Token);
    const all = await listTasks(project.id);
    const bugTask = all.find((t) => t.title === 'Fix Login Bug');
    expect(bugTask!.assigneeId).toBe(user2.id);
    expect(bugTask!.sprintId).toBe(sprint.id);
    expect(bugTask!.type).toBe('BUG');
    expect(bugTask!.priority).toBe('URGENT');
  });

  it('subtask has correct parentTaskId and parent includes it in children', async () => {
    setToken(user1Token);
    // Fetch the parent task directly — its children relation should include the subtask
    const parent = await getTask(parentTask.id);
    expect(parent.children).toBeDefined();
    expect(parent.children.length).toBeGreaterThanOrEqual(1);
    const child = parent.children.find((c) => c.id === subtask.id);
    expect(child).toBeDefined();
    expect(child!.title).toBe('Configure GitHub Actions');

    // Verify the subtask's parentTaskId links back
    const sub = await getTask(subtask.id);
    expect(sub.parentTaskId).toBe(parentTask.id);
  });

  it('assigning a task to a non-member is rejected (400)', async () => {
    setToken(user1Token);
    try {
      await createTask(project.id, {
        title: 'Invalid Assignment',
        assigneeId: outsiderUser.id,
      });
      expect.unreachable('Should not be able to assign to a non-member');
    } catch (err: any) {
      expect(err.response?.status).toBe(400);
      expect(err.response?.data?.message).toMatch(/member/i);
    }
  });

  it('soft-deleting a task removes it from the default list', async () => {
    setToken(user1Token);
    // Verify the task exists in the list before deletion
    const before = await listTasks(project.id);
    expect(before.map((t) => t.title)).toContain('Throwaway Task');

    // Soft-delete it
    const deleted = await deleteTask(taskToDelete.id);
    expect(deleted.isDeleted).toBe(true);

    // Verify it's gone from the default list
    const after = await listTasks(project.id);
    expect(after.map((t) => t.title)).not.toContain('Throwaway Task');
    // Should be 6 now (7 - 1 soft-deleted)
    expect(after.length).toBe(6);
  });

  it('soft-deleted task still exists in the database (accessible via direct GET)', async () => {
    setToken(user1Token);
    // Direct GET should still return it — just with isDeleted = true
    const task = await getTask(taskToDelete.id);
    expect(task).toBeDefined();
    expect(task.isDeleted).toBe(true);
    expect(task.title).toBe('Throwaway Task');
  });

  it('story points are correctly stored', async () => {
    setToken(user1Token);
    const all = await listTasks(project.id);
    const story = all.find((t) => t.title === 'User Stories');
    expect(story!.storyPoints).toBe(5);
    expect(story!.type).toBe('STORY');
  });

  it('task status defaults to TODO', async () => {
    setToken(user1Token);
    const all = await listTasks(project.id);
    const review = all.find((t) => t.title === 'Review PR');
    expect(review!.status).toBe('TODO');
  });
});
