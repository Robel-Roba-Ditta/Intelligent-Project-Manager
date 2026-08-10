import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  CheckSquare,
  Plus,
  Save,
  X,
  Edit3,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import {
  getTask,
  updateTask,
  createTask,
  changeTaskStatus,
  type TaskDto,
  type TaskStatus,
  type TaskPriority,
  type TaskType,
} from '../lib/tasksApi';
import { listEpics, type EpicDto } from '../lib/epicsApi';
import { listSprints, type SprintDto } from '../lib/sprintsApi';
import { listProjectMembers, type ProjectMemberDto } from '../lib/projectsApi';
import {
  listLabels,
  attachLabel,
  detachLabel,
  type LabelDto,
} from '../lib/labelsApi';
import { extractErrorMessage } from '../lib/api';
import { getInitials, avatarColorForName, formatRelativeTime } from '../lib/utils';

const STATUS_CONFIG: Record<TaskStatus, { label: string; dot: string }> = {
  TODO: { label: 'To Do', dot: 'bg-slate-400' },
  IN_PROGRESS: { label: 'In Progress', dot: 'bg-blue-500' },
  IN_REVIEW: { label: 'In Review', dot: 'bg-purple-500' },
  DONE: { label: 'Done', dot: 'bg-emerald-500' },
};

const TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ['IN_PROGRESS'],
  IN_PROGRESS: ['IN_REVIEW', 'TODO'],
  IN_REVIEW: ['DONE', 'IN_PROGRESS'],
  DONE: ['IN_PROGRESS'],
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  LOW: { label: 'Low', color: 'text-slate-600 bg-slate-50' },
  MEDIUM: { label: 'Medium', color: 'text-blue-600 bg-blue-50' },
  HIGH: { label: 'High', color: 'text-amber-600 bg-amber-50' },
  URGENT: { label: 'Urgent', color: 'text-red-600 bg-red-50' },
};

const TYPE_CONFIG: Record<TaskType, { label: string; color: string }> = {
  TASK: { label: 'Task', color: 'text-blue-600 bg-blue-50' },
  BUG: { label: 'Bug', color: 'text-red-600 bg-red-50' },
  STORY: { label: 'Story', color: 'text-emerald-600 bg-emerald-50' },
};

export function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<TaskDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Sidebar context
  const [epics, setEpics] = useState<EpicDto[]>([]);
  const [sprints, setSprints] = useState<SprintDto[]>([]);
  const [members, setMembers] = useState<ProjectMemberDto[]>([]);
  const [allLabels, setAllLabels] = useState<LabelDto[]>([]);

  // Inline editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState('');

  // Sidebar editing
  const [editingSidebar, setEditingSidebar] = useState(false);
  const [sidebarPriority, setSidebarPriority] = useState<TaskPriority>('MEDIUM');
  const [sidebarType, setSidebarType] = useState<TaskType>('TASK');
  const [sidebarAssigneeId, setSidebarAssigneeId] = useState('');
  const [sidebarEpicId, setSidebarEpicId] = useState('');
  const [sidebarSprintId, setSidebarSprintId] = useState('');
  const [sidebarStoryPoints, setSidebarStoryPoints] = useState('');
  const [sidebarDueDate, setSidebarDueDate] = useState('');

  // Subtask quick-add
  const [subtaskTitle, setSubtaskTitle] = useState('');

  // Label picker
  const [labelPickerOpen, setLabelPickerOpen] = useState(false);

  const loadTask = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      const data = await getTask(Number(id));
      setTask(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }, [id]);

  const loadContext = useCallback(async (projectId: number) => {
    try {
      const [e, s, m, l] = await Promise.all([
        listEpics(projectId),
        listSprints(projectId),
        listProjectMembers(projectId),
        listLabels(projectId),
      ]);
      setEpics(e);
      setSprints(s);
      setMembers(m);
      setAllLabels(l);
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => { loadTask(); }, [loadTask]);
  useEffect(() => {
    if (task) {
      loadContext(task.projectId);
    }
  }, [task?.projectId]);

  // Populate sidebar form values when task changes
  useEffect(() => {
    if (task) {
      setSidebarPriority(task.priority);
      setSidebarType(task.type);
      setSidebarAssigneeId(task.assigneeId?.toString() ?? '');
      setSidebarEpicId(task.epicId?.toString() ?? '');
      setSidebarSprintId(task.sprintId?.toString() ?? '');
      setSidebarStoryPoints(task.storyPoints?.toString() ?? '');
      setSidebarDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    }
  }, [task]);

  // ─── Actions ──────────────────────────────────────────────

  async function handleSaveTitle() {
    if (!task || !editTitle.trim()) return;
    setSaving(true);
    try {
      await updateTask(task.id, { title: editTitle.trim() });
      setEditingTitle(false);
      await loadTask();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDescription() {
    if (!task) return;
    setSaving(true);
    try {
      await updateTask(task.id, { description: editDesc });
      setEditingDesc(false);
      await loadTask();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus: TaskStatus) {
    if (!task) return;
    setSaving(true);
    setError(null);
    try {
      await changeTaskStatus(task.id, newStatus);
      await loadTask();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSidebar() {
    if (!task) return;
    setSaving(true);
    setError(null);
    try {
      await updateTask(task.id, {
        priority: sidebarPriority,
        type: sidebarType,
        assigneeId: sidebarAssigneeId ? Number(sidebarAssigneeId) : null,
        epicId: sidebarEpicId ? Number(sidebarEpicId) : null,
        sprintId: sidebarSprintId ? Number(sidebarSprintId) : null,
        storyPoints: sidebarStoryPoints ? Number(sidebarStoryPoints) : null,
        dueDate: sidebarDueDate || null,
      });
      setEditingSidebar(false);
      await loadTask();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSubtask(e: FormEvent) {
    e.preventDefault();
    if (!task || !subtaskTitle.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createTask(task.projectId, {
        title: subtaskTitle.trim(),
        parentTaskId: task.id,
      });
      setSubtaskTitle('');
      await loadTask();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleLabel(labelId: number, isAttached: boolean) {
    if (!task) return;
    setError(null);
    try {
      if (isAttached) {
        await detachLabel(task.id, labelId);
      } else {
        await attachLabel(task.id, labelId);
      }
      await loadTask();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  // ─── Render ───────────────────────────────────────────────

  if (!task && !error) {
    return (
      <AppShell>
        <div className="flex h-40 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-app border-t-brand" />
        </div>
      </AppShell>
    );
  }

  const sc = task ? STATUS_CONFIG[task.status] : null;
  const taskLabelIds = new Set((task?.labels || []).map((l) => l.id));

  return (
    <AppShell>
      {/* Back link */}
      {task && (
        <Link
          to={`/projects/${task.projectId}?tab=board`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={15} />
          Back to Board
        </Link>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {task && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* ─── Main Content ────────────────────────────────── */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="flex-1 rounded-lg border border-brand bg-white px-3 py-2 font-display text-xl font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand/20"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') setEditingTitle(false);
                    }}
                  />
                  <button onClick={handleSaveTitle} disabled={saving} className="rounded-lg bg-brand p-2 text-white hover:bg-brand-dark disabled:opacity-60"><Save size={16} /></button>
                  <button onClick={() => setEditingTitle(false)} className="rounded-lg p-2 text-muted hover:text-ink"><X size={16} /></button>
                </div>
              ) : (
                <h1
                  className="cursor-pointer font-display text-2xl font-semibold text-ink transition-colors hover:text-brand"
                  onClick={() => { setEditTitle(task.title); setEditingTitle(true); }}
                  title="Click to edit title"
                >
                  {task.title}
                </h1>
              )}
              <p className="mt-1 text-xs text-muted">
                Created {formatRelativeTime(task.createdAt)}
                {task.parent && (
                  <span> · Subtask of <Link to={`/tasks/${task.parent.id}`} className="text-brand hover:underline">{task.parent.title}</Link></span>
                )}
              </p>
            </div>

            {/* Description */}
            <div className="rounded-xl border border-border-app bg-surface p-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-ink">Description</h3>
                {!editingDesc && (
                  <button
                    type="button"
                    onClick={() => { setEditDesc(task.description || ''); setEditingDesc(true); }}
                    className="text-xs text-muted hover:text-ink"
                  >
                    <Edit3 size={13} />
                  </button>
                )}
              </div>
              {editingDesc ? (
                <div className="space-y-2">
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-border-light bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    placeholder="Add a description…"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveDescription} disabled={saving} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-60">Save</button>
                    <button onClick={() => setEditingDesc(false)} className="rounded-lg px-3 py-1.5 text-xs text-muted hover:text-ink">Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink/80 whitespace-pre-wrap">
                  {task.description || <span className="italic text-muted">No description</span>}
                </p>
              )}
            </div>

            {/* Subtasks */}
            <div className="rounded-xl border border-border-app bg-surface p-5">
              <h3 className="mb-3 font-display text-sm font-semibold text-ink flex items-center gap-2">
                <CheckSquare size={15} />
                Subtasks
                {task.children && task.children.length > 0 && (
                  <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-muted">{task.children.length}</span>
                )}
              </h3>

              {task.children && task.children.length > 0 ? (
                <ul className="mb-3 space-y-1">
                  {task.children.map((child) => (
                    <li key={child.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-canvas/50">
                      <span className={`h-2 w-2 rounded-full ${STATUS_CONFIG[child.status].dot}`} />
                      <Link to={`/tasks/${child.id}`} className="flex-1 text-sm text-ink hover:text-brand">{child.title}</Link>
                      <span className="text-[10px] text-muted">{STATUS_CONFIG[child.status].label}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mb-3 text-sm text-muted">No subtasks yet.</p>
              )}

              {/* Quick-add subtask */}
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                  type="text"
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  placeholder="Add a subtask…"
                  className="flex-1 rounded-lg border border-border-light bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <button
                  type="submit"
                  disabled={saving || !subtaskTitle.trim()}
                  className="flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
                >
                  <Plus size={13} />
                  Add
                </button>
              </form>
            </div>

            {/* Activity placeholder */}
            <div className="rounded-xl border border-dashed border-border-app bg-canvas/30 p-5">
              <h3 className="mb-2 font-display text-sm font-semibold text-ink flex items-center gap-2">
                <MessageSquare size={15} />
                Activity
              </h3>
              <p className="text-sm text-muted">Coming soon — comments, attachments, and activity log will appear here.</p>
            </div>
          </div>

          {/* ─── Right Sidebar ───────────────────────────────── */}
          <div className="space-y-4">
            {/* Status (uses workflow endpoint) */}
            <div className="rounded-xl border border-border-app bg-surface p-4">
              <h4 className="mb-2 font-mono text-[11px] tracking-wide text-muted uppercase">Status</h4>
              <div className="flex items-center gap-2 mb-2">
                <span className={`h-2.5 w-2.5 rounded-full ${sc!.dot}`} />
                <span className="text-sm font-medium text-ink">{sc!.label}</span>
              </div>
              {TRANSITIONS[task.status].length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {TRANSITIONS[task.status].map((target) => (
                    <button
                      key={target}
                      type="button"
                      onClick={() => handleStatusChange(target)}
                      disabled={saving}
                      className="rounded-lg border border-border-app px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-canvas disabled:opacity-60"
                    >
                      → {STATUS_CONFIG[target].label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Other fields */}
            <div className="rounded-xl border border-border-app bg-surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-mono text-[11px] tracking-wide text-muted uppercase">Details</h4>
                {!editingSidebar ? (
                  <button
                    type="button"
                    onClick={() => setEditingSidebar(true)}
                    className="text-xs text-muted hover:text-ink"
                  >
                    <Edit3 size={13} />
                  </button>
                ) : (
                  <div className="flex gap-1.5">
                    <button onClick={handleSaveSidebar} disabled={saving} className="rounded bg-brand px-2 py-1 text-[10px] font-medium text-white hover:bg-brand-dark disabled:opacity-60"><Save size={11} /></button>
                    <button onClick={() => setEditingSidebar(false)} className="rounded px-2 py-1 text-[10px] text-muted hover:text-ink"><X size={11} /></button>
                  </div>
                )}
              </div>
              <dl className="space-y-3 text-sm">
                {/* Priority */}
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Priority</dt>
                  {editingSidebar ? (
                    <select value={sidebarPriority} onChange={(e) => setSidebarPriority(e.target.value as TaskPriority)} className="rounded border border-border-light bg-white px-2 py-1 text-xs text-ink">
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  ) : (
                    <dd className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_CONFIG[task.priority].color}`}>{PRIORITY_CONFIG[task.priority].label}</dd>
                  )}
                </div>
                {/* Type */}
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Type</dt>
                  {editingSidebar ? (
                    <select value={sidebarType} onChange={(e) => setSidebarType(e.target.value as TaskType)} className="rounded border border-border-light bg-white px-2 py-1 text-xs text-ink">
                      <option value="TASK">Task</option>
                      <option value="BUG">Bug</option>
                      <option value="STORY">Story</option>
                    </select>
                  ) : (
                    <dd className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_CONFIG[task.type].color}`}>{TYPE_CONFIG[task.type].label}</dd>
                  )}
                </div>
                {/* Assignee */}
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Assignee</dt>
                  {editingSidebar ? (
                    <select value={sidebarAssigneeId} onChange={(e) => setSidebarAssigneeId(e.target.value)} className="rounded border border-border-light bg-white px-2 py-1 text-xs text-ink">
                      <option value="">Unassigned</option>
                      {members.map((m) => <option key={m.userId} value={m.userId}>{m.user.fullName}</option>)}
                    </select>
                  ) : (
                    <dd className="flex items-center gap-1.5 text-ink">
                      {task.assignee ? (
                        <>
                          <span className="flex h-5 w-5 items-center justify-center rounded-full font-mono text-[8px] font-medium text-white" style={{ backgroundColor: avatarColorForName(task.assignee.fullName) }}>
                            {getInitials(task.assignee.fullName)}
                          </span>
                          <span className="text-xs">{task.assignee.fullName}</span>
                        </>
                      ) : (
                        <span className="text-xs text-muted">Unassigned</span>
                      )}
                    </dd>
                  )}
                </div>
                {/* Due Date */}
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Due Date</dt>
                  {editingSidebar ? (
                    <input type="date" value={sidebarDueDate} onChange={(e) => setSidebarDueDate(e.target.value)} className="rounded border border-border-light bg-white px-2 py-1 text-xs text-ink" />
                  ) : (
                    <dd className="flex items-center gap-1 text-xs text-ink">
                      <Clock size={11} className="text-muted" />
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : <span className="text-muted">None</span>}
                    </dd>
                  )}
                </div>
                {/* Story Points */}
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Story Points</dt>
                  {editingSidebar ? (
                    <input type="number" min={0} value={sidebarStoryPoints} onChange={(e) => setSidebarStoryPoints(e.target.value)} placeholder="—" className="w-16 rounded border border-border-light bg-white px-2 py-1 text-xs text-ink" />
                  ) : (
                    <dd className="text-xs text-ink">{task.storyPoints ?? <span className="text-muted">—</span>}</dd>
                  )}
                </div>
                {/* Epic */}
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Epic</dt>
                  {editingSidebar ? (
                    <select value={sidebarEpicId} onChange={(e) => setSidebarEpicId(e.target.value)} className="rounded border border-border-light bg-white px-2 py-1 text-xs text-ink">
                      <option value="">None</option>
                      {epics.map((ep) => <option key={ep.id} value={ep.id}>{ep.name}</option>)}
                    </select>
                  ) : (
                    <dd className="text-xs text-ink">{task.epic?.name ?? <span className="text-muted">None</span>}</dd>
                  )}
                </div>
                {/* Sprint */}
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Sprint</dt>
                  {editingSidebar ? (
                    <select value={sidebarSprintId} onChange={(e) => setSidebarSprintId(e.target.value)} className="rounded border border-border-light bg-white px-2 py-1 text-xs text-ink">
                      <option value="">None</option>
                      {sprints.map((sp) => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                    </select>
                  ) : (
                    <dd className="text-xs text-ink">{task.sprint?.name ?? <span className="text-muted">None</span>}</dd>
                  )}
                </div>
              </dl>
            </div>

            {/* Labels */}
            <div className="rounded-xl border border-border-app bg-surface p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-mono text-[11px] tracking-wide text-muted uppercase">Labels</h4>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setLabelPickerOpen(!labelPickerOpen)}
                    className="text-muted hover:text-ink"
                    title="Add/remove labels"
                  >
                    <Plus size={14} />
                  </button>
                  {labelPickerOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setLabelPickerOpen(false)} />
                      <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-border-app bg-surface py-1 shadow-lg">
                        {allLabels.length === 0 ? (
                          <p className="px-3 py-2 text-xs text-muted">No labels created yet</p>
                        ) : (
                          allLabels.map((label) => {
                            const isAttached = taskLabelIds.has(label.id);
                            return (
                              <button
                                key={label.id}
                                type="button"
                                onClick={() => handleToggleLabel(label.id, isAttached)}
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-ink transition-colors hover:bg-canvas"
                              >
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: label.color }} />
                                <span className="flex-1">{label.name}</span>
                                {isAttached && <span className="text-[10px] text-brand">✓</span>}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {task.labels && task.labels.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {task.labels.map((label) => (
                    <span
                      key={label.id}
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted">No labels</p>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
