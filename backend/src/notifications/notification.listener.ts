import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { Task } from '../tasks/entities/task.entity';
import { Watcher } from '../watchers/entities/watcher.entity';
import { User } from '../users/entities/user.entity';
import { TaskAssigneeChangedEvent, TaskStatusChangedEvent } from '../activity/events';

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
  ) {}

  @OnEvent('task.assignee_changed')
  async onAssigneeChanged(event: TaskAssigneeChangedEvent) {
    // Notify the new assignee (skip if they assigned it to themselves)
    if (!event.toAssigneeId || event.toAssigneeId === event.actorId) return;

    const task = await this.tasksRepo.findOne({ where: { id: event.taskId } });
    if (!task) return;

    const actor = await this.usersRepo.findOne({ where: { id: event.actorId } });
    const actorName = actor?.fullName || 'Someone';

    await this.notifRepo.save(
      this.notifRepo.create({
        userId: event.toAssigneeId,
        taskId: event.taskId,
        type: 'assigned',
        message: `${actorName} assigned you to "${task.title}"`,
      }),
    );
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
      await this.notifRepo.save(notifications);
    }
  }
}
