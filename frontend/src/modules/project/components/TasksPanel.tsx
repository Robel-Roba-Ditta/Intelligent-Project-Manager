import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Plus, Trash2, X, ChevronRight, Tag, List, LayoutGrid, Search, Filter } from 'lucide-react';
import {
  listTasks,
  createTask,
  deleteTask,
  type TaskDto,
  type TaskStatus,
  type TaskPriority,
  type TaskType,
  type TaskFilters,
} from '../../task/api/tasksApi';
import { listEpics, type EpicDto } from '../../epic/api/epicsApi';
import { listSprints, type SprintDto } from '../../sprint/api/sprintsApi';
import { listProjectMembers, type ProjectMemberDto } from '../api/projectsApi';
import {
  listLabels,
  createLabel,
  deleteLabel,
  attachLabel,
  detachLabel,
  type LabelDto,
} from '../../label/api/labelsApi';
import { extractErrorMessage } from '../../../common/lib/api';
import { getInitials, avatarColorForName } from '../../../common/lib/utils';
import { BoardView } from './BoardView';

const STATUS_CONFIG: Record<TaskStatus, { label: string; dot: string }> = {
  TODO: { label: 'To Do', dot: 'bg-slate-400' },
  IN_PROGRESS: { label: 'In Progress', dot: 'bg-blue-500' },
  IN_REVIEW: { label: 'In Review', dot: 'bg-purple-500' },
  DONE: { label: 'Done', dot: 'bg-emerald-500' },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  LOW: { label: 'Low', color: 'text-slate-500 bg-slate-50 border-slate-200' },
  MEDIUM: { label: 'Medium', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  HIGH: { label: 'High', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  URGENT: { label: 'Urgent', color: 'text-red-600 bg-red-50 border-red-200' },
};

const TYPE_CONFIG: Record<TaskType, { label: string; color: string }> = {
  TASK: { label: 'Task', color: 'text-blue-600' },
  BUG: { label: 'Bug', color: 'text-red-600' },
  STORY: { label: 'Story', color: 'text-emerald-600' },
};

export function TasksPanel({ projectId }: { projectId: number }) {
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [epics, setEpics] = useState<EpicDto[]>([]);
  const [sprints, setSprints] = useState<SprintDto[]>([]);
  const [members, setMembers] = useState<ProjectMemberDto[]>([]);
  const [labels, setLabels] = useState<LabelDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  // Label management state
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#0C66E4');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [type, setType] = useState<TaskType>('TASK');
  const [storyPoints, setStoryPoints] = useState('');
  const [epicId, setEpicId] = useState('');
  const [sprintId, setSprintId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [parentTaskId, setParentTaskId] = useState('');

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterSprint, setFilterSprint] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  const activeFilterCount = [filterStatus, filterPriority, filterAssignee, filterSprint, filterSearch].filter(Boolean).length;

  async function load() {
    try {
      setError(null);
      const filters: TaskFilters = {};
      if (filterStatus) filters.status = filterStatus;
      if (filterPriority) filters.priority = filterPriority;
      if (filterAssignee) filters.assigneeId = Number(filterAssignee);
      if (filterSprint) filters.sprintId = Number(filterSprint);
      if (filterSearch) filters.search = filterSearch;

      const [t, e, s, m, l] = await Promise.all([
        listTasks(projectId, Object.keys(filters).length > 0 ? filters : undefined),
        listEpics(projectId),
        listSprints(projectId),
        listProjectMembers(projectId),
        listLabels(projectId),
      ]);
      setTasks(t);
      setEpics(e);
      setSprints(s);
      setMembers(m);
      setLabels(l);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  useEffect(() => {
    load();
  }, [projectId, filterStatus, filterPriority, filterAssignee, filterSprint, filterSearch]);

  function resetForm() {
    setTitle('');
    setDescription('');
    setStatus('TODO');
    setPriority('MEDIUM');
    setType('TASK');
    setStoryPoints('');
    setEpicId('');
    setSprintId('');
    setAssigneeId('');
    setParentTaskId('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await createTask(projectId, {
        title,
        description: description || undefined,
        status,
        priority,
        type,
        storyPoints: storyPoints ? Number(storyPoints) : undefined,
        epicId: epicId ? Number(epicId) : undefined,
        sprintId: sprintId ? Number(sprintId) : undefined,
        assigneeId: assigneeId ? Number(assigneeId) : undefined,
        parentTaskId: parentTaskId ? Number(parentTaskId) : undefined,
      });
      resetForm();
      setShowForm(false);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: number, taskTitle: string) {
    if (!window.confirm(`Delete task "${taskTitle}"?`)) return;
    setError(null);
    setBusy(true);
    try {
      await deleteTask(id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateLabel(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await createLabel(projectId, { name: newLabelName, color: newLabelColor });
      setNewLabelName('');
      setNewLabelColor('#0C66E4');
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteLabel(id: number, labelName: string) {
    if (!window.confirm(`Delete label "${labelName}"? It will be removed from all tasks.`)) return;
    setError(null);
    setBusy(true);
    try {
      await deleteLabel(id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleAttachLabel(taskId: number, labelId: number) {
    setError(null);
    try {
      await attachLabel(taskId, labelId);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function handleDetachLabel(taskId: number, labelId: number) {
    setError(null);
    try {
      await detachLabel(taskId, labelId);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  // Group top-level tasks (those without a parent, or whose parent is deleted)
  const topLevelTasks = tasks.filter((t) => !t.parentTaskId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-sm font-semibold text-ink">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </h3>
          <button
            type="button"
            onClick={() => setShowLabelManager(!showLabelManager)}
            className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-ink"
          >
            <Tag size={12} />
            Manage Labels
          </button>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-dark"
          >
            <Plus size={14} />
            New Task
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border-app bg-surface px-4 py-3">
        <div className="flex items-center gap-2 rounded-lg border border-border-light bg-white px-2.5 py-1.5 text-sm">
          <Search size={14} className="text-muted" />
          <input
            type="text"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder="Search tasks…"
            aria-label="Search tasks"
            className="w-28 bg-transparent text-xs text-ink placeholder:text-muted/60 focus:outline-none sm:w-40"
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filter by status" className="rounded-lg border border-border-light bg-white px-2.5 py-1.5 text-xs text-ink">
          <option value="">All statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Done</option>
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} aria-label="Filter by priority" className="rounded-lg border border-border-light bg-white px-2.5 py-1.5 text-xs text-ink">
          <option value="">All priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
        <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} aria-label="Filter by assignee" className="rounded-lg border border-border-light bg-white px-2.5 py-1.5 text-xs text-ink">
          <option value="">All assignees</option>
          {members.map((m) => <option key={m.userId} value={m.userId}>{m.user.fullName}</option>)}
        </select>
        <select value={filterSprint} onChange={(e) => setFilterSprint(e.target.value)} aria-label="Filter by sprint" className="rounded-lg border border-border-light bg-white px-2.5 py-1.5 text-xs text-ink">
          <option value="">All sprints</option>
          {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {activeFilterCount > 0 && (
          <>
            <span className="flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
              <Filter size={10} />
              {activeFilterCount} active
            </span>
            <button
              type="button"
              onClick={() => { setFilterStatus(''); setFilterPriority(''); setFilterAssignee(''); setFilterSprint(''); setFilterSearch(''); }}
              className="text-xs text-muted hover:text-ink"
              aria-label="Clear all filters"
            >
              Clear filters
            </button>
          </>
        )}
      </div>

      {/* View mode toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-border-app p-0.5">
        <button
          type="button"
          onClick={() => setViewMode('list')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            viewMode === 'list' ? 'bg-brand text-white' : 'text-muted hover:text-ink'
          }`}
        >
          <List size={13} />
          List
        </button>
        <button
          type="button"
          onClick={() => setViewMode('board')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            viewMode === 'board' ? 'bg-brand text-white' : 'text-muted hover:text-ink'
          }`}
        >
          <LayoutGrid size={13} />
          Board
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Label Manager */}
      {showLabelManager && (
        <div className="rounded-xl border border-border-app bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-display text-sm font-semibold text-ink">Project Labels</h4>
            <button type="button" onClick={() => setShowLabelManager(false)} className="text-muted hover:text-ink">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleCreateLabel} className="mb-3 flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="label-name" className="mb-1.5 block font-mono text-[11px] tracking-wide text-muted uppercase">Name</label>
              <input
                id="label-name"
                type="text"
                required
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Label name"
                className="w-full rounded-lg border border-border-light bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label htmlFor="label-color" className="mb-1.5 block font-mono text-[11px] tracking-wide text-muted uppercase">Color</label>
              <input
                id="label-color"
                type="color"
                value={newLabelColor}
                onChange={(e) => setNewLabelColor(e.target.value)}
                className="h-[38px] w-12 cursor-pointer rounded-lg border border-border-light bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={busy || !newLabelName.trim()}
              className="rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add
            </button>
          </form>
          {labels.length === 0 ? (
            <p className="text-xs text-muted">No labels yet.</p>
          ) : (
            <ul className="space-y-1">
              {labels.map((label) => (
                <li key={label.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-canvas/50">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: label.color }} />
                    <span className="text-sm text-ink">{label.name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteLabel(label.id, label.name)}
                    disabled={busy}
                    className="rounded p-1 text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                    title="Delete label"
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-border-app bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-display text-sm font-semibold text-ink">New Task</h4>
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="text-muted hover:text-ink">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Title */}
            <div>
              <label htmlFor="task-title" className="mb-1.5 block font-mono text-[11px] tracking-wide text-muted uppercase">Title</label>
              <input
                id="task-title"
                type="text"
                required
                minLength={2}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                className="w-full rounded-lg border border-border-light bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            {/* Description */}
            <div>
              <label htmlFor="task-desc" className="mb-1.5 block font-mono text-[11px] tracking-wide text-muted uppercase">Description</label>
              <textarea
                id="task-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Optional description"
                className="w-full rounded-lg border border-border-light bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            {/* Row: Status, Priority, Type */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="task-status" className="mb-1.5 block font-mono text-[11px] tracking-wide text-muted uppercase">Status</label>
                <select id="task-status" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="w-full rounded-lg border border-border-light bg-white px-3 py-[9px] text-sm text-ink">
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
              <div>
                <label htmlFor="task-priority" className="mb-1.5 block font-mono text-[11px] tracking-wide text-muted uppercase">Priority</label>
                <select id="task-priority" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="w-full rounded-lg border border-border-light bg-white px-3 py-[9px] text-sm text-ink">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label htmlFor="task-type" className="mb-1.5 block font-mono text-[11px] tracking-wide text-muted uppercase">Type</label>
                <select id="task-type" value={type} onChange={(e) => setType(e.target.value as TaskType)} className="w-full rounded-lg border border-border-light bg-white px-3 py-[9px] text-sm text-ink">
                  <option value="TASK">Task</option>
                  <option value="BUG">Bug</option>
                  <option value="STORY">Story</option>
                </select>
              </div>
            </div>
            {/* Row: Epic, Sprint, Assignee */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="task-epic" className="mb-1.5 block font-mono text-[11px] tracking-wide text-muted uppercase">Epic</label>
                <select id="task-epic" value={epicId} onChange={(e) => setEpicId(e.target.value)} className="w-full rounded-lg border border-border-light bg-white px-3 py-[9px] text-sm text-ink">
                  <option value="">None</option>
                  {epics.map((ep) => <option key={ep.id} value={ep.id}>{ep.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="task-sprint" className="mb-1.5 block font-mono text-[11px] tracking-wide text-muted uppercase">Sprint</label>
                <select id="task-sprint" value={sprintId} onChange={(e) => setSprintId(e.target.value)} className="w-full rounded-lg border border-border-light bg-white px-3 py-[9px] text-sm text-ink">
                  <option value="">None</option>
                  {sprints.map((sp) => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="task-assignee" className="mb-1.5 block font-mono text-[11px] tracking-wide text-muted uppercase">Assignee</label>
                <select id="task-assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="w-full rounded-lg border border-border-light bg-white px-3 py-[9px] text-sm text-ink">
                  <option value="">Unassigned</option>
                  {members.map((m) => <option key={m.userId} value={m.userId}>{m.user.fullName}</option>)}
                </select>
              </div>
            </div>
            {/* Row: Story Points, Parent Task */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="task-sp" className="mb-1.5 block font-mono text-[11px] tracking-wide text-muted uppercase">Story Points</label>
                <input id="task-sp" type="number" min={0} value={storyPoints} onChange={(e) => setStoryPoints(e.target.value)} placeholder="—" className="w-full rounded-lg border border-border-light bg-white px-3 py-[9px] text-sm text-ink" />
              </div>
              <div>
                <label htmlFor="task-parent" className="mb-1.5 block font-mono text-[11px] tracking-wide text-muted uppercase">Parent Task</label>
                <select id="task-parent" value={parentTaskId} onChange={(e) => setParentTaskId(e.target.value)} className="w-full rounded-lg border border-border-light bg-white px-3 py-[9px] text-sm text-ink">
                  <option value="">None (top-level)</option>
                  {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              Create Task
            </button>
          </form>
        </div>
      )}

      {/* Board view */}
      {viewMode === 'board' && (
        <BoardView projectId={projectId} />
      )}

      {/* Tasks list */}
      {viewMode === 'list' && (
        <>
          {tasks.length === 0 && !showForm ? (
            <div className="rounded-xl border border-dashed border-border-app py-10 text-center">
              <p className="text-sm text-muted">No tasks yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border-app bg-surface">
              <ul className="divide-y divide-border-app">
                {topLevelTasks.map((task) => (
                  <TaskRow key={task.id} task={task} allTasks={tasks} allLabels={labels} onDelete={handleDelete} onAttachLabel={handleAttachLabel} onDetachLabel={handleDetachLabel} busy={busy} depth={0} />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TaskRow({
  task,
  allTasks,
  allLabels,
  onDelete,
  onAttachLabel,
  onDetachLabel,
  busy,
  depth,
}: {
  task: TaskDto;
  allTasks: TaskDto[];
  allLabels: LabelDto[];
  onDelete: (id: number, title: string) => void;
  onAttachLabel: (taskId: number, labelId: number) => void;
  onDetachLabel: (taskId: number, labelId: number) => void;
  busy: boolean;
  depth: number;
}) {
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const sc = STATUS_CONFIG[task.status];
  const pc = PRIORITY_CONFIG[task.priority];
  const tc = TYPE_CONFIG[task.type];
  const children = allTasks.filter((t) => t.parentTaskId === task.id);
  const attachedLabelIds = new Set(task.labels.map((l) => l.id));
  const unattachedLabels = allLabels.filter((l) => !attachedLabelIds.has(l.id));

  return (
    <>
      <li
        className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-canvas/50"
        style={{ paddingLeft: `${20 + depth * 24}px` }}
      >
        {depth > 0 && (
          <ChevronRight size={12} className="shrink-0 text-muted/50" />
        )}
        <span className={`h-2 w-2 shrink-0 rounded-full ${sc.dot}`} />
        <div className="min-w-0 flex-1">
          <Link to={`/tasks/${task.id}`} className="block truncate text-sm font-medium text-ink hover:text-brand">{task.title}</Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted">
            <span className={tc.color}>{tc.label}</span>
            {task.assignee && (
              <span className="flex items-center gap-1">
                <span
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full font-mono text-[7px] font-medium text-white"
                  style={{ backgroundColor: avatarColorForName(task.assignee.fullName) }}
                >
                  {getInitials(task.assignee.fullName)}
                </span>
                {task.assignee.fullName}
              </span>
            )}
            {task.epic && <span>Epic: {task.epic.name}</span>}
            {task.sprint && <span>Sprint: {task.sprint.name}</span>}
            {task.storyPoints != null && <span>{task.storyPoints} pts</span>}
          </div>
          {/* Label chips */}
          {task.labels.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {task.labels.map((label) => (
                <span
                  key={label.id}
                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: `${label.color}15`,
                    color: label.color,
                    borderColor: `${label.color}30`,
                  }}
                >
                  {label.name}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDetachLabel(task.id, label.id); }}
                    className="ml-0.5 opacity-60 hover:opacity-100"
                    title={`Remove ${label.name}`}
                  >
                    <X size={8} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${pc.color}`}
        >
          {pc.label}
        </span>
        <span className="text-[10px] font-medium text-muted">{sc.label}</span>
        {/* Label attach button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLabelPicker(!showLabelPicker)}
            title="Add label"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <Tag size={14} />
          </button>
          {showLabelPicker && unattachedLabels.length > 0 && (
            <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-border-app bg-surface p-1 shadow-lg">
              {unattachedLabels.map((label) => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => { onAttachLabel(task.id, label.id); setShowLabelPicker(false); }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-ink hover:bg-canvas"
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: label.color }} />
                  {label.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDelete(task.id, task.title)}
          title="Delete"
          disabled={busy}
          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
        >
          <Trash2 size={14} />
        </button>
      </li>
      {children.map((child) => (
        <TaskRow key={child.id} task={child} allTasks={allTasks} allLabels={allLabels} onDelete={onDelete} onAttachLabel={onAttachLabel} onDetachLabel={onDetachLabel} busy={busy} depth={depth + 1} />
      ))}
    </>
  );
}
