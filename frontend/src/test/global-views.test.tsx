/**
 * Global Views End-to-End Test Suite
 *
 * Tests:
 * - GET /users
 * - GET /tasks/me
 * - GET /sprints/me/active
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { setToken, registerRequest, type AuthUser } from '../common/lib/api';
import { createProject, addProjectMember } from '../modules/project/api/projectsApi';
import { createTask, getMyTasks } from '../modules/task/api/tasksApi';
import { createSprint, startSprint } from '../modules/sprint/api/sprintsApi';
import { getMyActiveSprints } from '../modules/sprint/api/sprintsApi';
import { listUsers } from '../modules/user/api/usersApi';

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}

let user1: AuthUser;
let user2: AuthUser;
let token1: string;
let token2: string;

beforeAll(async () => {
  const res1 = await registerRequest({
    email: uniqueEmail('global-user1'),
    password: 'password123',
    fullName: 'Global User One',
  });
  user1 = res1.user;
  token1 = res1.accessToken;

  const res2 = await registerRequest({
    email: uniqueEmail('global-user2'),
    password: 'password123',
    fullName: 'Global User Two',
  });
  user2 = res2.user;
  token2 = res2.accessToken;
});

describe('Global Views APIs', () => {
  it('GET /users returns all users including newly registered ones', async () => {
    setToken(token1);
    const users = await listUsers();
    
    expect(users.length).toBeGreaterThanOrEqual(2);
    expect(users.find((u) => u.id === user1.id)).toBeDefined();
    expect(users.find((u) => u.id === user2.id)).toBeDefined();
    expect(users[0]).toHaveProperty('id');
    expect(users[0]).toHaveProperty('fullName');
    expect(users[0]).toHaveProperty('email');
    expect(users[0]).not.toHaveProperty('password');
  });

  it('GET /tasks/me returns only tasks assigned to the current user across projects', async () => {
    // Setup projects and tasks
    setToken(token1);
    const p1 = await createProject({ name: 'Project 1' });
    const p2 = await createProject({ name: 'Project 2' });
    
    await addProjectMember(p1.id, { email: user2.email, role: 'member' });
    await addProjectMember(p2.id, { email: user2.email, role: 'member' });

    // user1 tasks
    await createTask(p1.id, { title: 'U1 P1 Task', assigneeId: user1.id });
    await createTask(p2.id, { title: 'U1 P2 Task', assigneeId: user1.id });
    
    // user2 tasks
    await createTask(p1.id, { title: 'U2 P1 Task', assigneeId: user2.id });

    // Check user1
    const u1Tasks = await getMyTasks();
    const u1TaskTitles = u1Tasks.map(t => t.title);
    expect(u1TaskTitles).toContain('U1 P1 Task');
    expect(u1TaskTitles).toContain('U1 P2 Task');
    expect(u1TaskTitles).not.toContain('U2 P1 Task');
    expect(u1Tasks[0].project).toBeDefined();

    // Check user2
    setToken(token2);
    const u2Tasks = await getMyTasks();
    const u2TaskTitles = u2Tasks.map(t => t.title);
    expect(u2TaskTitles).toContain('U2 P1 Task');
    expect(u2TaskTitles).not.toContain('U1 P1 Task');
  });

  it('GET /sprints/me/active returns active sprints from projects the user is in', async () => {
    setToken(token1);
    const p3 = await createProject({ name: 'Project 3 (U1 only)' });
    const p4 = await createProject({ name: 'Project 4 (U1 and U2)' });
    await addProjectMember(p4.id, { email: user2.email, role: 'member' });

    const s3 = await createSprint(p3.id, { name: 'P3 Sprint Active' });
    await startSprint(s3.id);
    
    const s4_planned = await createSprint(p4.id, { name: 'P4 Sprint Planned' });
    const s4_active = await createSprint(p4.id, { name: 'P4 Sprint Active' });
    await startSprint(s4_active.id);

    // Check user1 (should see P3 Active and P4 Active)
    const u1Sprints = await getMyActiveSprints();
    const u1SprintIds = u1Sprints.map(s => s.id);
    expect(u1SprintIds).toContain(s3.id);
    expect(u1SprintIds).toContain(s4_active.id);
    expect(u1SprintIds).not.toContain(s4_planned.id);
    expect(u1Sprints[0].project).toBeDefined();

    // Check user2 (should see P4 Active, but not P3)
    setToken(token2);
    const u2Sprints = await getMyActiveSprints();
    const u2SprintIds = u2Sprints.map(s => s.id);
    expect(u2SprintIds).toContain(s4_active.id);
    expect(u2SprintIds).not.toContain(s3.id);
    expect(u2SprintIds).not.toContain(s4_planned.id);
  });
});
