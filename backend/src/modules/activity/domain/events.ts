
export class TaskStatusChangedEvent {
  constructor(
    public readonly taskId: number,
    public readonly actorId: number,
    public readonly fromStatus: string,
    public readonly toStatus: string,
  ) {}
}

export class TaskAssigneeChangedEvent {
  constructor(
    public readonly taskId: number,
    public readonly actorId: number,
    public readonly fromAssigneeId: number | null,
    public readonly toAssigneeId: number | null,
  ) {}
}

export class TaskCommentPostedEvent {
  constructor(
    public readonly taskId: number,
    public readonly actorId: number,
    public readonly commentId: number,
  ) {}
}

export class TaskAttachmentAddedEvent {
  constructor(
    public readonly taskId: number,
    public readonly actorId: number,
    public readonly attachmentId: number,
    public readonly fileName: string,
  ) {}
}

export class TaskWatcherToggledEvent {
  constructor(
    public readonly taskId: number,
    public readonly actorId: number,
    public readonly watching: boolean,
  ) {}
}

export class TaskDependencyAddedEvent {
  constructor(
    public readonly taskId: number,
    public readonly actorId: number,
    public readonly blockingTaskId: number,
    public readonly blockedTaskId: number,
  ) {}
}

export class TaskTimeLoggedEvent {
  constructor(
    public readonly taskId: number,
    public readonly actorId: number,
    public readonly hours: number,
    public readonly date: string,
  ) {}
}
