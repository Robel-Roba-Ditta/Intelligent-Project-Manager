import { describe, it, expect, beforeAll } from 'vitest';
import { setToken, registerRequest } from '../common/lib/api';
import { createProject } from '../modules/project/api/projectsApi';
import { createTask, type TaskDto } from '../modules/task/api/tasksApi';
import { createDependency, listDependencies } from '../modules/dependency/api/dependenciesApi';


function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}


let token: string;
let taskA: TaskDto;
let taskB: TaskDto;


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

  await createDependency(taskA.id, taskB.id);
});


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
    expect(depsA.blocks.length).toBe(1);
    expect(depsB.blockedBy.length).toBe(1);
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
