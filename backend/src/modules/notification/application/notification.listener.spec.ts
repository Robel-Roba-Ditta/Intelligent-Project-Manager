import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationListener } from './notification.listener';
import { NotificationGateway } from '../api/gateways/notification.gateway';
import { Notification } from '../domain/notification.entity';
import { Task } from '../../task/domain/task.entity';
import { Watcher } from '../../watcher/domain/watcher.entity';
import { User } from '../../user/domain/user.entity';
import {
  TaskAssigneeChangedEvent,
  TaskStatusChangedEvent,
} from '../../activity/domain/events';

describe('NotificationListener', () => {
  let listener: NotificationListener;
  let notifRepo: { create: jest.Mock; save: jest.Mock };
  let tasksRepo: { findOne: jest.Mock };
  let watchersRepo: { find: jest.Mock };
  let usersRepo: { findOne: jest.Mock };
  let gateway: { server: { to: jest.Mock } };

  beforeEach(async () => {
    notifRepo = {
      create: jest.fn().mockImplementation((n) => ({ ...n, id: Math.random() })),
      save: jest.fn().mockImplementation((n) => Promise.resolve(Array.isArray(n) ? n : n)),
    };
    tasksRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 1, title: 'Test Task', assigneeId: 10 }),
    };
    watchersRepo = { find: jest.fn().mockResolvedValue([]) };
    usersRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 1, fullName: 'Actor User' }),
    };
    const emitMock = jest.fn();
    gateway = {
      server: {
        to: jest.fn().mockReturnValue({ emit: emitMock }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationListener,
        { provide: getRepositoryToken(Notification), useValue: notifRepo },
        { provide: getRepositoryToken(Task), useValue: tasksRepo },
        { provide: getRepositoryToken(Watcher), useValue: watchersRepo },
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: NotificationGateway, useValue: gateway },
      ],
    }).compile();

    listener = module.get<NotificationListener>(NotificationListener);
  });

  describe('onAssigneeChanged', () => {
    it('creates notification for the new assignee', async () => {
      const event = new TaskAssigneeChangedEvent(1, 5, null, 10);
      await listener.onAssigneeChanged(event);

      expect(notifRepo.save).toHaveBeenCalled();
      expect(notifRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 10, type: 'assigned' }),
      );
    });

    it('does NOT notify when actor assigns to themselves', async () => {
      const event = new TaskAssigneeChangedEvent(1, 10, null, 10);
      await listener.onAssigneeChanged(event);

      expect(notifRepo.save).not.toHaveBeenCalled();
    });

    it('does NOT notify when toAssigneeId is null (unassign)', async () => {
      const event = new TaskAssigneeChangedEvent(1, 5, 10, null);
      await listener.onAssigneeChanged(event);

      expect(notifRepo.save).not.toHaveBeenCalled();
    });

    it('pushes via WebSocket to the assignee room', async () => {
      const event = new TaskAssigneeChangedEvent(1, 5, null, 10);
      await listener.onAssigneeChanged(event);

      expect(gateway.server.to).toHaveBeenCalledWith('user:10');
    });
  });

  describe('onStatusChanged', () => {
    it('notifies assignee when actor is different', async () => {
      const event = new TaskStatusChangedEvent(1, 5, 'TODO', 'IN_PROGRESS');
      await listener.onStatusChanged(event);

      expect(notifRepo.save).toHaveBeenCalled();
      // The notifications array should include assignee (10), not actor (5)
      const savedNotifs = notifRepo.save.mock.calls[0][0];
      expect(savedNotifs).toHaveLength(1);
      expect(savedNotifs[0].userId).toBe(10);
    });

    it('does NOT include actor in recipients (actor excluded)', async () => {
      // Actor is also the assignee — should NOT get a notification
      tasksRepo.findOne.mockResolvedValue({ id: 1, title: 'Test', assigneeId: 5 });
      const event = new TaskStatusChangedEvent(1, 5, 'TODO', 'IN_PROGRESS');
      await listener.onStatusChanged(event);

      // No recipients remain after excluding actor
      expect(notifRepo.save).not.toHaveBeenCalled();
    });

    it('includes watchers (excluding actor) in recipients', async () => {
      watchersRepo.find.mockResolvedValue([
        { userId: 20, taskId: 1 },
        { userId: 30, taskId: 1 },
        { userId: 5, taskId: 1 }, // actor — should be excluded
      ]);
      const event = new TaskStatusChangedEvent(1, 5, 'TODO', 'IN_PROGRESS');
      await listener.onStatusChanged(event);

      const savedNotifs = notifRepo.save.mock.calls[0][0];
      const recipientIds = savedNotifs.map((n: any) => n.userId);
      expect(recipientIds).toContain(10); // assignee
      expect(recipientIds).toContain(20);
      expect(recipientIds).toContain(30);
      expect(recipientIds).not.toContain(5); // actor excluded
    });
  });
});
