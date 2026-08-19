import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../domain/notification.entity';
import { Task } from '../../task/domain/task.entity';
import { Watcher } from '../../watcher/domain/watcher.entity';
import { User } from '../../user/domain/user.entity';
import { TaskAssigneeChangedEvent, TaskStatusChangedEvent } from '../../activity/domain/events';
import { NotificationGateway } from '../api/gateways/notification.gateway';

@Injectable()
export class NotificationListener {
  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    @InjectRepository(Task)
    private readonly tasksRepo: Repository<Task>,
    @InjectRepository(Watcher)
    private readonly watchersRepo: Repository<Watcher>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly gateway: NotificationGateway,
  ) {}

  @OnEvent('task.assignee_changed')
  async onAssigneeChanged(event: TaskAssigneeChangedEvent) {
    // Notify the new assignee (skip if they assigned it to themselves)
    if (!event.toAssigneeId || event.toAssigneeId === event.actorId) return;

    const task = await this.tasksRepo.findOne({ where: { id: event.taskId } });
    if (!task) return;

    const actor = await this.usersRepo.findOne({ where: { id: event.actorId } });
    const actorName = actor?.fullName || 'Someone';

    const saved = await this.notifRepo.save(
      this.notifRepo.create({
        userId: event.toAssigneeId,
        taskId: event.taskId,
        type: 'assigned',
        message: `${actorName} assigned you to "${task.title}"`,
      }),
    );

    // Push via WebSocket
    this.gateway.server
      .to(`user:${event.toAssigneeId}`)
      .emit('notification', saved);
  }

  @OnEvent('task.status_changed')
  async onStatusChanged(event: TaskStatusChangedEvent) {
    const task = await this.tasksRepo.findOne({ where: { id: event.taskId } });
    if (!task) return;

    const actor = await this.usersRepo.findOne({ where: { id: event.actorId } });
    const actorName = actor?.fullName || 'Someone';
    const msg = `${actorName} changed "${task.title}" from ${event.fromStatus} to ${event.toStatus}`;

    // Collect recipients: task assignee + all watchers, excluding the actor
    const recipientIds = new Set<number>();

    if (task.assigneeId && task.assigneeId !== event.actorId) {
      recipientIds.add(task.assigneeId);
    }

    const watchers = await this.watchersRepo.find({ where: { taskId: event.taskId } });
    for (const w of watchers) {
      if (w.userId !== event.actorId) {
        recipientIds.add(w.userId);
      }
    }

    const notifications = Array.from(recipientIds).map((uid) =>
      this.notifRepo.create({
        userId: uid,
        taskId: event.taskId,
        type: 'status_changed',
        message: msg,
      }),
    );

    if (notifications.length > 0) {
      const saved = await this.notifRepo.save(notifications);

      // Push each notification via WebSocket to the respective user
      for (const notif of saved) {
        this.gateway.server
          .to(`user:${notif.userId}`)
          .emit('notification', notif);
      }
    }
  }
}
