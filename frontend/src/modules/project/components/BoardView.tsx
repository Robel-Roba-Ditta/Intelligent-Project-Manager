import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ChevronDown, Plus, Tag } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  listTasks,
  changeTaskStatus,
  type TaskDto,
  type TaskStatus,
  type TaskPriority,
} from '../../task/api/tasksApi';
import {
  listLabels,
  attachLabel,
  detachLabel,
  type LabelDto,
} from '../../label/api/labelsApi';
import { extractErrorMessage } from '../../../common/lib/api';
import { getInitials, avatarColorForName } from '../../../common/lib/utils';
import { LabelsManager } from '../../label/components/LabelsManager';

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
  DONE: ['IN_REVIEW'],
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
  const [activeTask, setActiveTask] = useState<TaskDto | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

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

  function handleDragStart(event: DragStartEvent) {
    const draggedTask = tasks.find((t) => t.id === event.active.id);
    setActiveTask(draggedTask || null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as number;
    const targetStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // No-op if dropped on same column
    if (task.status === targetStatus) return;

    // Only move if it's a legal transition
    const allowed = TRANSITIONS[task.status];
    if (!allowed.includes(targetStatus)) return;

    await handleMove(taskId, targetStatus);
  }

  // Compute valid drop targets based on the dragged task
  const validTargets = activeTask ? TRANSITIONS[activeTask.status] : [];

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

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <DroppableColumn
              key={col.status}
              col={col}
              tasks={tasks.filter((t) => t.status === col.status)}
              allLabels={allLabels}
              onMove={handleMove}
              onToggleLabel={handleToggleLabel}
              moving={moving}
              isValidTarget={validTargets.includes(col.status)}
              isDragging={!!activeTask}
              isSourceColumn={activeTask?.status === col.status}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask && (
            <div className="w-64 rotate-2 opacity-90">
              <TaskCardContent task={activeTask} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function DroppableColumn({
  col,
  tasks,
  allLabels,
  onMove,
  onToggleLabel,
  moving,
  isValidTarget,
  isDragging,
  isSourceColumn,
}: {
  col: { status: TaskStatus; label: string; accent: string; headerBg: string };
  tasks: TaskDto[];
  allLabels: LabelDto[];
  onMove: (id: number, status: TaskStatus) => void;
  onToggleLabel: (taskId: number, labelId: number, isAttached: boolean) => void;
  moving: number | null;
  isValidTarget: boolean;
  isDragging: boolean;
  isSourceColumn: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.status });

  // Visual feedback during drag
  let columnClasses = `flex flex-col rounded-xl border border-border-app border-t-[3px] ${col.accent} bg-canvas/50 transition-all duration-200`;
  if (isDragging && !isSourceColumn) {
    if (isValidTarget) {
      columnClasses += isOver
        ? ' ring-2 ring-brand bg-brand/5 scale-[1.01]'
        : ' ring-1 ring-brand/40';
    } else {
      columnClasses += ' opacity-40';
    }
  }

  return (
    <div ref={setNodeRef} className={columnClasses}>
      {/* Column header */}
      <div className={`flex items-center justify-between rounded-t-lg px-3 py-2.5 ${col.headerBg}`}>
        <h4 className="text-xs font-semibold text-ink">{col.label}</h4>
        <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-muted">
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2 p-2">
        {tasks.length === 0 && (
          <p className="py-6 text-center text-xs text-muted/60">No tasks</p>
        )}
        {tasks.map((task) => (
          <DraggableTaskCard
            key={task.id}
            task={task}
            allLabels={allLabels}
            onMove={onMove}
            onToggleLabel={onToggleLabel}
            isMoving={moving === task.id}
          />
        ))}
      </div>
    </div>
  );
}

function DraggableTaskCard({
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
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`transition-opacity ${isDragging ? 'opacity-30' : ''}`}
      {...attributes}
      {...listeners}
    >
      <TaskCardWithActions
        task={task}
        allLabels={allLabels}
        onMove={onMove}
        onToggleLabel={onToggleLabel}
        isMoving={isMoving}
      />
    </div>
  );
}

function TaskCardContent({ task }: { task: TaskDto }) {
  const pc = PRIORITY_CONFIG[task.priority];
  const tc = TYPE_ICON[task.type];

  return (
    <div className="rounded-lg border border-border-app bg-surface p-3 shadow-sm">
      <div className="mb-1.5 flex items-start gap-2">
        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold ${tc.color}`}>
          {tc.label}
        </span>
        <span className="flex-1 text-sm font-medium text-ink">{task.title}</span>
      </div>
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
      <div className="flex items-center gap-1.5">
        <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-semibold ${pc.color}`}>
          {pc.label}
        </span>
        {task.assignee && (
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full font-mono text-[8px] font-medium text-white"
            style={{ backgroundColor: avatarColorForName(task.assignee.fullName) }}
            title={task.assignee.fullName}
          >
            {getInitials(task.assignee.fullName)}
          </span>
        )}
      </div>
    </div>
  );
}

function TaskCardWithActions({
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
          onPointerDown={(e) => e.stopPropagation()}
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
              onClick={(e) => { e.stopPropagation(); setLabelPickerOpen(!labelPickerOpen); }}
              onPointerDown={(e) => e.stopPropagation()}
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
                onClick={(e) => { e.stopPropagation(); setMoveDropdownOpen(!moveDropdownOpen); }}
                onPointerDown={(e) => e.stopPropagation()}
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
