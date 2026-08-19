import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../domain/activity-log.entity';
import {
  TaskStatusChangedEvent,
  TaskAssigneeChangedEvent,
  TaskCommentPostedEvent,
  TaskAttachmentAddedEvent,
  TaskWatcherToggledEvent,
  TaskDependencyAddedEvent,
  TaskTimeLoggedEvent,
} from '../domain/events';

@Injectable()
export class ActivityListener {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityRepo: Repository<ActivityLog>,
  ) {}

  @OnEvent('task.status_changed')
  async onStatusChanged(event: TaskStatusChangedEvent) {
    await this.activityRepo.save(
      this.activityRepo.create({
        taskId: event.taskId,
        actorId: event.actorId,
        action: 'status_changed',
        details: { fromStatus: event.fromStatus, toStatus: event.toStatus },
      }),
    );
  }

  @OnEvent('task.assignee_changed')
  async onAssigneeChanged(event: TaskAssigneeChangedEvent) {
    await this.activityRepo.save(
      this.activityRepo.create({
        taskId: event.taskId,
        actorId: event.actorId,
        action: 'assignee_changed',
        details: { fromAssigneeId: event.fromAssigneeId, toAssigneeId: event.toAssigneeId },
      }),
    );
  }

  @OnEvent('task.comment_posted')
  async onCommentPosted(event: TaskCommentPostedEvent) {
    await this.activityRepo.save(
      this.activityRepo.create({
        taskId: event.taskId,
        actorId: event.actorId,
        action: 'comment_posted',
        details: { commentId: event.commentId },
      }),
    );
  }

  @OnEvent('task.attachment_added')
  async onAttachmentAdded(event: TaskAttachmentAddedEvent) {
    await this.activityRepo.save(
      this.activityRepo.create({
        taskId: event.taskId,
        actorId: event.actorId,
        action: 'attachment_added',
        details: { attachmentId: event.attachmentId, fileName: event.fileName },
      }),
    );
  }

  @OnEvent('task.watcher_toggled')
  async onWatcherToggled(event: TaskWatcherToggledEvent) {
    await this.activityRepo.save(
      this.activityRepo.create({
        taskId: event.taskId,
        actorId: event.actorId,
        action: 'watcher_toggled',
        details: { watching: event.watching },
      }),
    );
  }

  @OnEvent('task.dependency_added')
  async onDependencyAdded(event: TaskDependencyAddedEvent) {
    await this.activityRepo.save(
      this.activityRepo.create({
        taskId: event.taskId,
        actorId: event.actorId,
        action: 'dependency_added',
        details: { blockingTaskId: event.blockingTaskId, blockedTaskId: event.blockedTaskId },
      }),
    );
  }

  @OnEvent('task.time_logged')
  async onTimeLogged(event: TaskTimeLoggedEvent) {
    await this.activityRepo.save(
      this.activityRepo.create({
        taskId: event.taskId,
        actorId: event.actorId,
        action: 'time_logged',
        details: { hours: event.hours, date: event.date },
      }),
    );
  }
}
