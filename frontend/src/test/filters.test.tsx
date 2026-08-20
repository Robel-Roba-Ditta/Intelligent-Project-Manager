import { describe, it, expect, beforeAll } from 'vitest';
import { setToken, registerRequest } from '../common/lib/api';
import { createProject, addProjectMember } from '../modules/project/api/projectsApi';
import { createTask, listTasks } from '../modules/task/api/tasksApi';


function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}


let token1: string;
let user2Id: number;
let projectId: number;


beforeAll(async () => {
  const res1 = await registerRequest({
    email: uniqueEmail('filter-u1'),
    password: 'password123',
    fullName: 'Filter Owner',
  });
  token1 = res1.accessToken;
  setToken(token1);

  const res2 = await registerRequest({
    email: uniqueEmail('filter-u2'),
    password: 'password123',
    fullName: 'Filter Worker',
  });
  user2Id = res2.user.id;

  setToken(token1);
  const project = await createProject({ name: 'Filter Test Project' });
  projectId = project.id;
  await addProjectMember(projectId, { email: res2.user.email, role: 'member' });

  await createTask(projectId, { title: 'Task A', description: 'alpha description', status: 'TODO', priority: 'HIGH', assigneeId: user2Id });
  await createTask(projectId, { title: 'Task B', description: 'beta description', status: 'IN_PROGRESS', priority: 'HIGH', assigneeId: res1.user.id });
  await createTask(projectId, { title: 'Task C', status: 'TODO', priority: 'LOW', assigneeId: user2Id });
  await createTask(projectId, { title: 'Task D', status: 'DONE', priority: 'MEDIUM', assigneeId: res1.user.id });
});


describe('Task Filtering', () => {
  it('filter by status=TODO returns only TODO tasks', async () => {
    setToken(token1);
    const tasks = await listTasks(projectId, { status: 'TODO' });
    expect(tasks.length).toBe(2); 
    expect(tasks.every((t) => t.status === 'TODO')).toBe(true);
  });

  it('filter by priority=HIGH returns only HIGH tasks', async () => {
    setToken(token1);
    const tasks = await listTasks(projectId, { priority: 'HIGH' });
    expect(tasks.length).toBe(2); 
    expect(tasks.every((t) => t.priority === 'HIGH')).toBe(true);
  });

  it('combined assignee + priority filters with AND (intersection)', async () => {
    setToken(token1);
    const tasks = await listTasks(projectId, { assigneeId: user2Id, priority: 'HIGH' });
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('Task A');
    expect(tasks[0].priority).toBe('HIGH');
    expect(tasks[0].assigneeId).toBe(user2Id);
  });

  it('search by keyword matches title', async () => {
    setToken(token1);
    const tasks = await listTasks(projectId, { search: 'Task A' });
    expect(tasks.length).toBeGreaterThanOrEqual(1);
    expect(tasks.some((t) => t.title === 'Task A')).toBe(true);
  });

  it('search by keyword matches description', async () => {
    setToken(token1);
    const tasks = await listTasks(projectId, { search: 'alpha' });
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('Task A');
    expect(tasks[0].description).toContain('alpha');
  });

  it('search combined with status filter uses AND', async () => {
    setToken(token1);
    const tasks = await listTasks(projectId, { search: 'beta', status: 'TODO' });
    expect(tasks.length).toBe(0);
  });
});
