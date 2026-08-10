import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ChevronDown, Plus, Tag } from 'lucide-react';
import {
  listTasks,
  changeTaskStatus,
  type TaskDto,
  type TaskStatus,
  type TaskPriority,
} from '../../lib/tasksApi';
import {
  listLabels,
  attachLabel,
  detachLabel,
  type LabelDto,
} from '../../lib/labelsApi';
import { extractErrorMessage } from '../../lib/api';
import { getInitials, avatarColorForName } from '../../lib/utils';
import { LabelsManager } from '../labels/LabelsManager';

const COLUMNS: { status: TaskStatus; label: string; accent: string; headerBg: string }[] = [
  { status: 'TODO', label: 'To Do', accent: 'border-t-slate-400', headerBg: 'bg-slate-50' },
  { status: 'IN_PROGRESS', label: 'In Progress', accent: 'border-t-blue-500', headerBg: 'bg-blue-50' },
  { status: 'IN_REVIEW', label: 'In Review', accent: 'border-t-purple-500', headerBg: 'bg-purple-50' },
  { status: 'DONE', label: 'Done', accent: 'border-t-emerald-500', headerBg: 'bg-emerald-50' },
];

const TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ['IN_PROGRESS'],
  IN_PROGRESS: ['IN_REVIEW', 'TODO'],
  IN_REVIEW: ['DONE', 'IN_PROGRESS'],
  DONE: ['IN_PROGRESS'],
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  LOW: { label: 'Low', color: 'text-slate-500 bg-slate-50 border-slate-200' },
  MEDIUM: { label: 'Med', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  HIGH: { label: 'High', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  URGENT: { label: 'Urgent', color: 'text-red-600 bg-red-50 border-red-200' },
};

const TYPE_ICON: Record<string, { label: string; color: string }> = {
  TASK: { label: 'T', color: 'bg-blue-100 text-blue-700' },
  BUG: { label: 'B', color: 'bg-red-100 text-red-700' },
  STORY: { label: 'S', color: 'bg-emerald-100 text-emerald-700' },
};

export function BoardView({ projectId }: { projectId: number }) {
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [allLabels, setAllLabels] = useState<LabelDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [moving, setMoving] = useState<number | null>(null);
  const [showLabelsManager, setShowLabelsManager] = useState(false);

  async function load() {
    try {
      setError(null);
      const [t, l] = await Promise.all([listTasks(projectId), listLabels(projectId)]);
      setTasks(t);
      setAllLabels(l);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  useEffect(() => {
    load();
  }, [projectId]);

  async function handleMove(taskId: number, newStatus: TaskStatus) {
    setError(null);
    setMoving(taskId);
    try {
      await changeTaskStatus(taskId, newStatus);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setMoving(null);
    }
  }

  async function handleToggleLabel(taskId: number, labelId: number, isAttached: boolean) {
    setError(null);
    try {
      if (isAttached) {
        await detachLabel(taskId, labelId);
      } else {
        await attachLabel(taskId, labelId);
      }
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      {/* Board header with labels manager toggle */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-ink">Board</h3>
        <button
          type="button"
          onClick={() => setShowLabelsManager(!showLabelsManager)}
          className="flex items-center gap-1.5 rounded-lg border border-border-app px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-canvas hover:text-ink"
        >
          <Tag size={13} />
          Manage Labels
        </button>
      </div>

      {showLabelsManager && (
        <LabelsManager projectId={projectId} onClose={() => { setShowLabelsManager(false); load(); }} />
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.status);
          return (
            <div
              key={col.status}
              className={`flex flex-col rounded-xl border border-border-app border-t-[3px] ${col.accent} bg-canvas/50`}
            >
              {/* Column header */}
              <div className={`flex items-center justify-between rounded-t-lg px-3 py-2.5 ${col.headerBg}`}>
                <h4 className="text-xs font-semibold text-ink">{col.label}</h4>
                <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                  {columnTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-1 flex-col gap-2 p-2">
                {columnTasks.length === 0 && (
                  <p className="py-6 text-center text-xs text-muted/60">No tasks</p>
                )}
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    allLabels={allLabels}
                    onMove={handleMove}
                    onToggleLabel={handleToggleLabel}
                    isMoving={moving === task.id}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  allLabels,
  onMove,
  onToggleLabel,
  isMoving,
}: {
  task: TaskDto;
  allLabels: LabelDto[];
  onMove: (id: number, status: TaskStatus) => void;
  onToggleLabel: (taskId: number, labelId: number, isAttached: boolean) => void;
  isMoving: boolean;
}) {
  const [moveDropdownOpen, setMoveDropdownOpen] = useState(false);
  const [labelPickerOpen, setLabelPickerOpen] = useState(false);
  const targets = TRANSITIONS[task.status];
  const pc = PRIORITY_CONFIG[task.priority];
  const tc = TYPE_ICON[task.type];
  const taskLabelIds = new Set((task.labels || []).map((l) => l.id));

  return (
    <div className="group relative rounded-lg border border-border-app bg-surface p-3 shadow-sm transition-shadow hover:shadow-md">
      {/* Type indicator + clickable title */}
      <div className="mb-1.5 flex items-start gap-2">
        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold ${tc.color}`}>
          {tc.label}
        </span>
        <Link
          to={`/tasks/${task.id}`}
          className="flex-1 text-sm font-medium text-ink transition-colors hover:text-brand"
        >
          {task.title}
        </Link>
      </div>

      {/* Label chips */}
      {task.labels && task.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1 pl-7">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Bottom row: priority + label picker + assignee + move button */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-semibold ${pc.color}`}>
            {pc.label}
          </span>
          {/* Label picker trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLabelPickerOpen(!labelPickerOpen)}
              className="flex h-5 w-5 items-center justify-center rounded text-muted/60 transition-colors hover:bg-canvas hover:text-ink"
              title="Add/remove labels"
            >
              <Plus size={11} />
            </button>
            {labelPickerOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setLabelPickerOpen(false)} />
                <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-border-app bg-surface py-1 shadow-lg">
                  {allLabels.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted">No labels created yet</p>
                  ) : (
                    allLabels.map((label) => {
                      const isAttached = taskLabelIds.has(label.id);
                      return (
                        <button
                          key={label.id}
                          type="button"
                          onClick={() => {
                            onToggleLabel(task.id, label.id, isAttached);
                            setLabelPickerOpen(false);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-ink transition-colors hover:bg-canvas"
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: label.color }}
                          />
                          <span className="flex-1">{label.name}</span>
                          {isAttached && (
                            <span className="text-[10px] text-brand">✓</span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {task.assignee && (
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full font-mono text-[8px] font-medium text-white"
              style={{ backgroundColor: avatarColorForName(task.assignee.fullName) }}
              title={task.assignee.fullName}
            >
              {getInitials(task.assignee.fullName)}
            </span>
          )}
          {targets.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoveDropdownOpen(!moveDropdownOpen)}
                disabled={isMoving}
                className="flex items-center gap-0.5 rounded bg-canvas px-1.5 py-1 text-[10px] font-medium text-muted transition-colors hover:bg-border-app hover:text-ink disabled:opacity-50"
                title="Move to"
              >
                Move
                <ChevronDown size={10} />
              </button>
              {moveDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMoveDropdownOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-1 min-w-[120px] rounded-lg border border-border-app bg-surface py-1 shadow-lg">
                    {targets.map((targetStatus) => (
                      <button
                        key={targetStatus}
                        type="button"
                        onClick={() => {
                          setMoveDropdownOpen(false);
                          onMove(task.id, targetStatus);
                        }}
                        className="block w-full px-3 py-1.5 text-left text-xs text-ink transition-colors hover:bg-canvas"
                      >
                        {STATUS_LABEL[targetStatus]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
