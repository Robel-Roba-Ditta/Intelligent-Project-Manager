import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { getMyTasks, type TaskDto } from '../lib/tasksApi';
import { extractErrorMessage } from '../lib/api';
import { AlertCircle, CheckSquare, Clock, ArrowRight } from 'lucide-react';
import { formatDueDate } from '../lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  TODO: { label: 'To Do', color: 'bg-slate-500' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-500' },
  IN_REVIEW: { label: 'In Review', color: 'bg-purple-500' },
  DONE: { label: 'Done', color: 'bg-emerald-500' },
};

const PRIORITY_CONFIG: Record<string, { label: string; dot: string }> = {
  LOW: { label: 'Low', dot: 'bg-slate-400' },
  MEDIUM: { label: 'Medium', dot: 'bg-blue-500' },
  HIGH: { label: 'High', dot: 'bg-amber-500' },
  URGENT: { label: 'Urgent', dot: 'bg-red-500' },
};

export function MyTasks() {
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTasks() {
      try {
        setError(null);
        const data = await getMyTasks();
        setTasks(data);
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  // Group tasks by project
  const tasksByProject = tasks.reduce((acc, task) => {
    const projectName = task.project?.name || `Project #${task.projectId}`;
    if (!acc[projectName]) acc[projectName] = [];
    acc[projectName].push(task);
    return acc;
  }, {} as Record<string, TaskDto[]>);

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">My Tasks</h1>
        <p className="text-sm text-muted">All tasks assigned to you across all projects.</p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-app border-t-brand" />
        </div>
      ) : tasks.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(tasksByProject).map(([projectName, projectTasks]) => (
            <div key={projectName} className="rounded-xl border border-border-app bg-surface p-1">
              <div className="flex items-center gap-2 px-4 py-3">
                <div className="h-2 w-2 rounded-full bg-brand" />
                <h2 className="font-display text-sm font-semibold text-ink">{projectName}</h2>
                <span className="rounded-full bg-canvas px-2 py-0.5 text-[10px] font-medium text-muted">
                  {projectTasks.length} tasks
                </span>
              </div>
              <div className="flex flex-col">
                {projectTasks.map((task, index) => (
                  <Link
                    key={task.id}
                    to={`/tasks/${task.id}`}
                    className={`group flex items-center justify-between gap-4 p-3 transition-colors hover:bg-canvas ${
                      index !== 0 ? 'border-t border-border-app/50' : ''
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="mt-0.5 shrink-0">
                        <CheckSquare size={16} className={task.status === 'DONE' ? 'text-emerald-500' : 'text-muted/50'} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-medium transition-colors group-hover:text-brand ${task.status === 'DONE' ? 'text-muted line-through' : 'text-ink'}`}>
                          {task.title}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-[11px]">
                          <div className="flex items-center gap-1 text-muted">
                            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[task.status]?.color || 'bg-slate-400'}`} />
                            {STATUS_CONFIG[task.status]?.label || task.status}
                          </div>
                          <div className="flex items-center gap-1 text-muted">
                            <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_CONFIG[task.priority]?.dot || 'bg-slate-400'}`} />
                            {PRIORITY_CONFIG[task.priority]?.label || task.priority}
                          </div>
                          {task.dueDate && (
                            <div className={`flex items-center gap-1 ${formatDueDate(task.dueDate).isOverdue && task.status !== 'DONE' ? 'text-danger font-medium' : 'text-muted'}`}>
                              <Clock size={11} />
                              {formatDueDate(task.dueDate).label}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100">
                      <ArrowRight size={16} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-app bg-surface p-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-canvas text-muted">
            <CheckSquare size={24} />
          </div>
          <h3 className="mb-1 font-display text-lg font-semibold text-ink">You're all caught up!</h3>
          <p className="text-sm text-muted">You don't have any tasks assigned to you right now.</p>
        </div>
      )}
    </AppShell>
  );
}
