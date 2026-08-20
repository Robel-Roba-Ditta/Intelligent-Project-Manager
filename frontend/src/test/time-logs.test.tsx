import { describe, it, expect, beforeAll } from 'vitest';
import { setToken, registerRequest } from '../common/lib/api';
import { createProject } from '../modules/project/api/projectsApi';
import { createTask, type TaskDto } from '../modules/task/api/tasksApi';
import { createTimeLog, listTimeLogs } from '../modules/time-log/api/timeLogsApi';


function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}


let token: string;
let task: TaskDto;


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

  await createTimeLog(task.id, { hours: 2, date: '2026-01-10' });
  await createTimeLog(task.id, { hours: 3.5, date: '2026-01-11' });
});


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
