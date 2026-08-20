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
  listTasks,
  createTask,
  getTask,
  deleteTask,
  type TaskDto,
} from '../modules/task/api/tasksApi';


function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}


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


beforeAll(async () => {
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

  setToken(user1Token);
  project = await createProject({ name: 'Task Test Project' });
  project = await addProjectMember(project.id, { email: res2.user.email, role: 'member' });

  epic = await createEpic(project.id, { name: 'Test Epic' });
  sprint = await createSprint(project.id, { name: 'Test Sprint' });

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

  subtask = await createTask(project.id, {
    title: 'Configure GitHub Actions',
    priority: 'MEDIUM',
    type: 'TASK',
    parentTaskId: parentTask.id,
  });

  taskToDelete = await createTask(project.id, {
    title: 'Throwaway Task',
    priority: 'LOW',
    type: 'TASK',
  });
});


describe('Tasks — CRUD, validation, subtasks, soft-delete', () => {
  it('created tasks have the correct properties', async () => {
    setToken(user1Token);
    const all = await listTasks(project.id);
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
    const parent = await getTask(parentTask.id);
    expect(parent.children).toBeDefined();
    expect(parent.children.length).toBeGreaterThanOrEqual(1);
    const child = parent.children.find((c) => c.id === subtask.id);
    expect(child).toBeDefined();
    expect(child!.title).toBe('Configure GitHub Actions');

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
    const before = await listTasks(project.id);
    expect(before.map((t) => t.title)).toContain('Throwaway Task');

    const deleted = await deleteTask(taskToDelete.id);
    expect(deleted.isDeleted).toBe(true);

    const after = await listTasks(project.id);
    expect(after.map((t) => t.title)).not.toContain('Throwaway Task');
    expect(after.length).toBe(6);
  });

  it('soft-deleted task still exists in the database (accessible via direct GET)', async () => {
    setToken(user1Token);
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
