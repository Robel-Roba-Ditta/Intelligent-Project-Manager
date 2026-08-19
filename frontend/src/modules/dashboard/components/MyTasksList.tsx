import { CheckCircle2 } from 'lucide-react';
import type { Task, TaskPriority, TaskStatus } from '../../../common/types/types';
import { formatDueDate } from '../../../common/lib/utils';

const STATUS_STYLE: Record<TaskStatus, { label: string; className: string }> = {
  todo: { label: 'To Do', className: 'bg-canvas text-muted' },
  in_progress: { label: 'In Progress', className: 'bg-accent-progress/10 text-accent-progress' },
  in_review: { label: 'In Review', className: 'bg-indigo-100 text-indigo-600' },
  done: { label: 'Done', className: 'bg-accent-done/10 text-accent-done-dim' },
};

const PRIORITY_STYLE: Record<TaskPriority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-canvas text-priority-low' },
  medium: { label: 'Medium', className: 'bg-priority-medium/10 text-priority-medium' },
  high: { label: 'High', className: 'bg-priority-high/10 text-priority-high' },
  urgent: { label: 'Urgent', className: 'bg-priority-urgent/10 text-priority-urgent' },
};

export function MyTasksList({ tasks }: { tasks: Task[] }) {
  return (
    <div className="rounded-xl border border-border-app bg-surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink">My tasks</h3>
        <span className="text-sm text-muted">{tasks.length} assigned</span>
      </div>

      <ul className="mt-3 divide-y divide-border-app">
        {tasks.map((task) => {
          const due = formatDueDate(task.dueDate);
          const isDone = task.status === 'done';
          return (
            <li key={task.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <CheckCircle2
                size={18}
                className={isDone ? 'shrink-0 text-accent-done' : 'shrink-0 text-border-app'}
                strokeWidth={2}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-medium ${isDone ? 'text-muted line-through' : 'text-ink'}`}
                >
                  {task.title}
                </p>
                <p className="truncate text-xs text-muted">{task.projectName}</p>
              </div>
              <span
                className={`hidden shrink-0 rounded-full px-2 py-0.5 text-xs font-medium sm:inline ${PRIORITY_STYLE[task.priority].className}`}
              >
                {PRIORITY_STYLE[task.priority].label}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[task.status].className}`}
              >
                {STATUS_STYLE[task.status].label}
              </span>
              <span
                className={`hidden w-20 shrink-0 text-right text-xs md:inline ${due.isOverdue && !isDone ? 'font-medium text-danger' : 'text-muted'}`}
              >
                {due.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
