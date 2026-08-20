import { describe, it, expect, beforeAll } from 'vitest';
import { setToken, registerRequest } from '../common/lib/api';
import { createProject, addProjectMember } from '../modules/project/api/projectsApi';
import { createTask, updateTask, changeTaskStatus, type TaskDto } from '../modules/task/api/tasksApi';
import { watchTask } from '../modules/watcher/api/watchersApi';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '../modules/notification/api/notificationsApi';


function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
}


let token1: string;
let token2: string;
let token3: string;
let user2Id: number;
let projectId: number;
let task: TaskDto;


beforeAll(async () => {
  const res1 = await registerRequest({
    email: uniqueEmail('notif-u1'),
    password: 'password123',
    fullName: 'Notif Actor',
  });
  token1 = res1.accessToken;

  const res2 = await registerRequest({
    email: uniqueEmail('notif-u2'),
    password: 'password123',
    fullName: 'Notif Assignee',
  });
  token2 = res2.accessToken;
  user2Id = res2.user.id;

  const res3 = await registerRequest({
    email: uniqueEmail('notif-u3'),
    password: 'password123',
    fullName: 'Notif Watcher',
  });
  token3 = res3.accessToken;

  setToken(token1);
  const project = await createProject({ name: 'Notification Test Project' });
  projectId = project.id;
  await addProjectMember(projectId, { email: res2.user.email, role: 'member' });
  await addProjectMember(projectId, { email: res3.user.email, role: 'member' });

  task = await createTask(projectId, { title: 'Notif Test Task' });
});


describe('Notifications', () => {
  it('assigning a task to user2 creates an "assigned" notification for user2', async () => {
    setToken(token1);
    await updateTask(task.id, { assigneeId: user2Id });

    await new Promise((r) => setTimeout(r, 200));

    setToken(token2);
    const data = await listNotifications();
    const assignedNotifs = data.notifications.filter(
      (n) => n.type === 'assigned' && n.taskId === task.id,
    );
    expect(assignedNotifs.length).toBeGreaterThanOrEqual(1);
    expect(assignedNotifs[0].message).toContain('assigned');
    expect(assignedNotifs[0].isRead).toBe(false);
  });

  it('status change notifies assignee (user2) and watcher (user3), excludes actor (user1)', async () => {
    setToken(token3);
    await watchTask(task.id);

    setToken(token1);
    await changeTaskStatus(task.id, 'IN_PROGRESS');

    await new Promise((r) => setTimeout(r, 200));

    setToken(token2);
    const data2 = await listNotifications();
    const statusNotifs2 = data2.notifications.filter(
      (n) => n.type === 'status_changed' && n.taskId === task.id,
    );
    expect(statusNotifs2.length).toBeGreaterThanOrEqual(1);
    expect(statusNotifs2[0].message).toContain('IN_PROGRESS');

    setToken(token3);
    const data3 = await listNotifications();
    const statusNotifs3 = data3.notifications.filter(
      (n) => n.type === 'status_changed' && n.taskId === task.id,
    );
    expect(statusNotifs3.length).toBeGreaterThanOrEqual(1);

    setToken(token1);
    const data1 = await listNotifications();
    const statusNotifs1 = data1.notifications.filter(
      (n) => n.type === 'status_changed' && n.taskId === task.id,
    );
    expect(statusNotifs1.length).toBe(0);
  });

  it('markRead marks a single notification as read', async () => {
    setToken(token2);
    const before = await listNotifications();
    const unread = before.notifications.find((n) => !n.isRead);
    expect(unread).toBeDefined();

    await markNotificationRead(unread!.id);

    const after = await listNotifications();
    const updated = after.notifications.find((n) => n.id === unread!.id);
    expect(updated!.isRead).toBe(true);
  });

  it('markAllRead clears all unread notifications', async () => {
    setToken(token2);
    await markAllNotificationsRead();

    const data = await listNotifications();
    expect(data.unreadCount).toBe(0);
    expect(data.notifications.every((n) => n.isRead)).toBe(true);
  });
});
