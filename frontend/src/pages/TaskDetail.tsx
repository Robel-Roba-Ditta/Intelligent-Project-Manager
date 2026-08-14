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
  Activity,
  Eye,
  EyeOff,
  MessageSquare,
  Paperclip,
  ExternalLink,
  Trash2,
  Send,
  Clock,
  GitBranch,
  Search,
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import {
  getTask,
  updateTask,
  createTask,
  changeTaskStatus,
  listTasks,
  type TaskDto,
  type TaskStatus,
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
import {
  listComments,
  createComment,
  deleteComment,
  type CommentDto,
} from '../lib/commentsApi';
import {
  listAttachments,
  createAttachment,
  deleteAttachment,
  type AttachmentDto,
} from '../lib/attachmentsApi';
import { watchTask, unwatchTask, getWatchStatus } from '../lib/watchersApi';
import { listActivity, type ActivityLogDto } from '../lib/activityApi';
import {
  listTimeLogs,
  createTimeLog,
  deleteTimeLog,
  type TimeLogDto,
} from '../lib/timeLogsApi';
import {
  listDependencies,
  createDependency,
  deleteDependency,
  type DependencyTaskRef,
} from '../lib/dependenciesApi';
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

function formatActivityLine(entry: ActivityLogDto): string {
  const d = entry.details;
  switch (entry.action) {
    case 'status_changed':
      return `changed status from ${STATUS_CONFIG[d.fromStatus as TaskStatus]?.label || d.fromStatus} to ${STATUS_CONFIG[d.toStatus as TaskStatus]?.label || d.toStatus}`;
    case 'assignee_changed':
      return d.toAssigneeId ? 'assigned this task' : 'unassigned this task';
    case 'comment_posted':
      return 'commented';
    case 'attachment_added':
      return `added an attachment "${d.fileName}"`;
    case 'watcher_toggled':
      return d.watching ? 'started watching' : 'stopped watching';
    case 'dependency_added':
      return `linked this as blocking Task #${d.blockedTaskId}`;
    case 'time_logged':
      return `logged ${d.hours}h`;
    default:
      return entry.action;
  }
}

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

  // Subtask quick-add
  const [subtaskTitle, setSubtaskTitle] = useState('');

  // Label picker
  const [labelPickerOpen, setLabelPickerOpen] = useState(false);

  // Watch state
  const [watching, setWatching] = useState(false);

  // Comments
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [commentBody, setCommentBody] = useState('');

  // Attachments
  const [attachments, setAttachments] = useState<AttachmentDto[]>([]);
  const [attachFileName, setAttachFileName] = useState('');
  const [attachFileUrl, setAttachFileUrl] = useState('');

  // Activity log (from API)
  const [activityEntries, setActivityEntries] = useState<ActivityLogDto[]>([]);

  // Time logs
  const [timeLogs, setTimeLogs] = useState<TimeLogDto[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [logHours, setLogHours] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

  // Dependencies
  const [blocks, setBlocks] = useState<DependencyTaskRef[]>([]);
  const [blockedBy, setBlockedBy] = useState<DependencyTaskRef[]>([]);
  const [depPickerOpen, setDepPickerOpen] = useState(false);
  const [depSearch, setDepSearch] = useState('');
  const [projectTasks, setProjectTasks] = useState<TaskDto[]>([]);

  const taskId = id ? Number(id) : null;

  const loadTask = useCallback(async () => {
    if (!taskId) return;
    try {
      setError(null);
      const data = await getTask(taskId);
      setTask(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }, [taskId]);

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

  const loadComments = useCallback(async () => {
    if (!taskId) return;
    try { setComments(await listComments(taskId)); } catch { /* non-critical */ }
  }, [taskId]);

  const loadAttachments = useCallback(async () => {
    if (!taskId) return;
    try { setAttachments(await listAttachments(taskId)); } catch { /* non-critical */ }
  }, [taskId]);

  const loadWatchStatus = useCallback(async () => {
    if (!taskId) return;
    try {
      const res = await getWatchStatus(taskId);
      setWatching(res.watching);
    } catch { /* non-critical */ }
  }, [taskId]);

  const loadActivity = useCallback(async () => {
    if (!taskId) return;
    try { setActivityEntries(await listActivity(taskId)); } catch { /* non-critical */ }
  }, [taskId]);

  const loadTimeLogs = useCallback(async () => {
    if (!taskId) return;
    try {
      const data = await listTimeLogs(taskId);
      setTimeLogs(data.entries);
      setTotalHours(data.totalHours);
    } catch { /* non-critical */ }
  }, [taskId]);

  const loadDependencies = useCallback(async () => {
    if (!taskId) return;
    try {
      const data = await listDependencies(taskId);
      setBlocks(data.blocks);
      setBlockedBy(data.blockedBy);
    } catch { /* non-critical */ }
  }, [taskId]);

  useEffect(() => {
    loadTask();
    loadComments();
    loadAttachments();
    loadWatchStatus();
    loadActivity();
    loadTimeLogs();
    loadDependencies();
  }, [loadTask, loadComments, loadAttachments, loadWatchStatus, loadActivity, loadTimeLogs, loadDependencies]);

  useEffect(() => {
    if (task) {
      loadContext(task.projectId);
    }
  }, [task?.projectId]);

  // ─── Actions ──────────────────────────────────────────────

  async function handleSaveTitle() {
    if (!task || !editTitle.trim()) return;
    setSaving(true);
    try {
      await updateTask(task.id, { title: editTitle.trim() });
      setEditingTitle(false);
      await loadTask();
    } catch (err) { setError(extractErrorMessage(err)); } finally { setSaving(false); }
  }

  async function handleSaveDescription() {
    if (!task) return;
    setSaving(true);
    try {
      await updateTask(task.id, { description: editDesc });
      setEditingDesc(false);
      await loadTask();
    } catch (err) { setError(extractErrorMessage(err)); } finally { setSaving(false); }
  }

  async function handleStatusChange(newStatus: TaskStatus) {
    if (!task) return;
    setSaving(true); setError(null);
    try {
      await changeTaskStatus(task.id, newStatus);
      await loadTask();
      await loadActivity();
    } catch (err) { setError(extractErrorMessage(err)); } finally { setSaving(false); }
  }

  async function handleFieldSave(field: string, value: any) {
    if (!task) return;
    setSaving(true); setError(null);
    try {
      await updateTask(task.id, { [field]: value });
      await loadTask();
      if (field === 'assigneeId') await loadActivity();
    } catch (err) { setError(extractErrorMessage(err)); } finally { setSaving(false); }
  }

  async function handleAddSubtask(e: FormEvent) {
    e.preventDefault();
    if (!task || !subtaskTitle.trim()) return;
    setSaving(true); setError(null);
    try {
      await createTask(task.projectId, { title: subtaskTitle.trim(), parentTaskId: task.id });
      setSubtaskTitle('');
      await loadTask();
    } catch (err) { setError(extractErrorMessage(err)); } finally { setSaving(false); }
  }

  async function handleToggleLabel(labelId: number, isAttached: boolean) {
    if (!task) return;
    setError(null);
    try {
      if (isAttached) { await detachLabel(task.id, labelId); }
      else { await attachLabel(task.id, labelId); }
      await loadTask();
    } catch (err) { setError(extractErrorMessage(err)); }
  }

  async function handleToggleWatch() {
    if (!taskId) return;
    setSaving(true); setError(null);
    try {
      if (watching) { await unwatchTask(taskId); setWatching(false); }
      else { await watchTask(taskId); setWatching(true); }
      await loadActivity();
    } catch (err) { setError(extractErrorMessage(err)); } finally { setSaving(false); }
  }

  async function handlePostComment(e: FormEvent) {
    e.preventDefault();
    if (!taskId || !commentBody.trim()) return;
    setSaving(true); setError(null);
    try {
      await createComment(taskId, commentBody.trim());
      setCommentBody('');
      await loadComments();
      await loadActivity();
    } catch (err) { setError(extractErrorMessage(err)); } finally { setSaving(false); }
  }

  async function handleDeleteComment(commentId: number) {
    setSaving(true); setError(null);
    try {
      await deleteComment(commentId);
      await loadComments();
    } catch (err) { setError(extractErrorMessage(err)); } finally { setSaving(false); }
  }

  async function handleAddAttachment(e: FormEvent) {
    e.preventDefault();
    if (!taskId || !attachFileName.trim() || !attachFileUrl.trim()) return;
    setSaving(true); setError(null);
    try {
      await createAttachment(taskId, { fileName: attachFileName.trim(), fileUrl: attachFileUrl.trim() });
      setAttachFileName(''); setAttachFileUrl('');
      await loadAttachments();
      await loadActivity();
    } catch (err) { setError(extractErrorMessage(err)); } finally { setSaving(false); }
  }

  async function handleDeleteAttachment(attachmentId: number) {
    setSaving(true); setError(null);
    try {
      await deleteAttachment(attachmentId);
      await loadAttachments();
    } catch (err) { setError(extractErrorMessage(err)); } finally { setSaving(false); }
  }

  async function handleLogTime(e: FormEvent) {
    e.preventDefault();
    if (!taskId || !logHours || !logDate) return;
    setSaving(true); setError(null);
    try {
      await createTimeLog(taskId, { hours: parseFloat(logHours), date: logDate });
      setLogHours('');
      await loadTimeLogs();
      await loadActivity();
    } catch (err) { setError(extractErrorMessage(err)); } finally { setSaving(false); }
  }

  async function handleDeleteTimeLog(entryId: number) {
    setSaving(true); setError(null);
    try {
      await deleteTimeLog(entryId);
      await loadTimeLogs();
    } catch (err) { setError(extractErrorMessage(err)); } finally { setSaving(false); }
  }

  async function handleAddDependency(blockedTaskId: number) {
    if (!taskId) return;
    setSaving(true); setError(null);
    try {
      await createDependency(taskId, blockedTaskId);
      setDepPickerOpen(false);
      setDepSearch('');
      await loadDependencies();
      await loadActivity();
    } catch (err) { setError(extractErrorMessage(err)); } finally { setSaving(false); }
  }

  async function handleRemoveDependency(depId: number) {
    setSaving(true); setError(null);
    try {
      await deleteDependency(depId);
      await loadDependencies();
    } catch (err) { setError(extractErrorMessage(err)); } finally { setSaving(false); }
  }

  async function openDepPicker() {
    if (!task) return;
    try {
      const tasks = await listTasks(task.projectId);
      setProjectTasks(tasks.filter((t) => t.id !== taskId));
    } catch { /* ignore */ }
    setDepPickerOpen(true);
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

  const depSearchFiltered = projectTasks.filter(
    (t) => t.title.toLowerCase().includes(depSearch.toLowerCase()),
  ).slice(0, 10);

  return (
    <AppShell>
      {/* Back link */}
      {task && (
        <Link
          to={`/projects/${task.projectId}?tab=tasks`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={15} />
          Back to Tasks
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
                  <button type="button" onClick={() => { setEditDesc(task.description || ''); setEditingDesc(true); }} className="text-xs text-muted hover:text-ink"><Edit3 size={13} /></button>
                )}
              </div>
              {editingDesc ? (
                <div className="space-y-2">
                  <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={4} className="w-full rounded-lg border border-border-light bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" placeholder="Add a description…" autoFocus />
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
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input type="text" value={subtaskTitle} onChange={(e) => setSubtaskTitle(e.target.value)} placeholder="Add a subtask…" className="flex-1 rounded-lg border border-border-light bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                <button type="submit" disabled={saving || !subtaskTitle.trim()} className="flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"><Plus size={13} /> Add</button>
              </form>
            </div>

            {/* Dependencies */}
            <div className="rounded-xl border border-border-app bg-surface p-5">
              <h3 className="mb-3 font-display text-sm font-semibold text-ink flex items-center gap-2">
                <GitBranch size={15} />
                Dependencies
              </h3>

              {/* Blocks */}
              <div className="mb-3">
                <p className="mb-1.5 text-[11px] font-medium tracking-wide text-muted uppercase">Blocks</p>
                {blocks.length > 0 ? (
                  <ul className="space-y-1">
                    {blocks.map((dep) => (
                      <li key={dep.dependencyId} className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-canvas/50">
                        <span className={`h-2 w-2 rounded-full ${STATUS_CONFIG[dep.task.status]?.dot || 'bg-slate-400'}`} />
                        <Link to={`/tasks/${dep.task.id}`} className="flex-1 text-sm text-ink hover:text-brand">{dep.task.title}</Link>
                        <span className="text-[10px] text-muted">{STATUS_CONFIG[dep.task.status]?.label || dep.task.status}</span>
                        <button type="button" onClick={() => handleRemoveDependency(dep.dependencyId)} disabled={saving} className="rounded p-1 text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50" aria-label={`Remove dependency on ${dep.task.title}`}><Trash2 size={11} /></button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted">No tasks blocked by this one.</p>
                )}
              </div>

              {/* Blocked by */}
              <div className="mb-3">
                <p className="mb-1.5 text-[11px] font-medium tracking-wide text-muted uppercase">Blocked by</p>
                {blockedBy.length > 0 ? (
                  <ul className="space-y-1">
                    {blockedBy.map((dep) => (
                      <li key={dep.dependencyId} className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-canvas/50">
                        <span className={`h-2 w-2 rounded-full ${STATUS_CONFIG[dep.task.status]?.dot || 'bg-slate-400'}`} />
                        <Link to={`/tasks/${dep.task.id}`} className="flex-1 text-sm text-ink hover:text-brand">{dep.task.title}</Link>
                        <span className="text-[10px] text-muted">{STATUS_CONFIG[dep.task.status]?.label || dep.task.status}</span>
                        <button type="button" onClick={() => handleRemoveDependency(dep.dependencyId)} disabled={saving} className="rounded p-1 text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50" aria-label={`Remove blocked-by dependency on ${dep.task.title}`}><Trash2 size={11} /></button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted">Not blocked by any task.</p>
                )}
              </div>

              {/* Add dependency picker */}
              <div className="relative">
                <button type="button" onClick={openDepPicker} className="flex items-center gap-1 text-xs font-medium text-brand hover:underline"><Plus size={12} /> Add dependency</button>
                {depPickerOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDepPickerOpen(false)} />
                    <div className="absolute left-0 top-full z-20 mt-1 w-72 rounded-lg border border-border-app bg-surface p-2 shadow-lg">
                      <div className="mb-2 flex items-center gap-2 rounded-lg border border-border-light bg-white px-2.5 py-1.5">
                        <Search size={13} className="text-muted" />
                        <input
                          type="text"
                          value={depSearch}
                          onChange={(e) => setDepSearch(e.target.value)}
                          placeholder="Search tasks…"
                          autoFocus
                          aria-label="Search tasks to add dependency"
                          className="flex-1 text-xs text-ink placeholder:text-muted/60 focus:outline-none bg-transparent"
                        />
                      </div>
                      {depSearchFiltered.length > 0 ? (
                        <ul className="max-h-40 overflow-y-auto space-y-0.5">
                          {depSearchFiltered.map((t) => (
                            <li key={t.id}>
                              <button
                                type="button"
                                onClick={() => handleAddDependency(t.id)}
                                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-ink transition-colors hover:bg-canvas"
                              >
                                <span className={`h-2 w-2 rounded-full ${STATUS_CONFIG[t.status].dot}`} />
                                <span className="flex-1 truncate">{t.title}</span>
                                <span className="text-[10px] text-muted">{STATUS_CONFIG[t.status].label}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="px-2 py-1.5 text-xs text-muted">No matching tasks</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Time Logs */}
            <div className="rounded-xl border border-border-app bg-surface p-5">
              <h3 className="mb-3 font-display text-sm font-semibold text-ink flex items-center gap-2">
                <Clock size={15} />
                Time Logs
                <span className="ml-auto rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">{totalHours}h logged</span>
              </h3>

              {timeLogs.length > 0 ? (
                <ul className="mb-3 space-y-1.5">
                  {timeLogs.map((entry) => (
                    <li key={entry.id} data-testid={`time-log-${entry.id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-canvas/50">
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[7px] font-medium text-white"
                        style={{ backgroundColor: avatarColorForName(entry.user?.fullName || 'Unknown') }}
                      >
                        {getInitials(entry.user?.fullName || '?')}
                      </span>
                      <span className="flex-1 text-sm text-ink">{entry.user?.fullName || 'Unknown'}</span>
                      <span className="font-mono text-xs font-medium text-ink">{Number(entry.hours)}h</span>
                      <span className="text-[10px] text-muted">{entry.date}</span>
                      <button type="button" onClick={() => handleDeleteTimeLog(entry.id)} disabled={saving} className="rounded p-1 text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50" aria-label={`Delete time log entry for ${entry.date}`}><Trash2 size={11} /></button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mb-3 text-sm text-muted">No time logged yet.</p>
              )}

              <form onSubmit={handleLogTime} className="flex gap-2">
                <input
                  type="number"
                  step="0.25"
                  min="0.01"
                  value={logHours}
                  onChange={(e) => setLogHours(e.target.value)}
                  placeholder="Hours"
                  aria-label="Hours to log"
                  className="w-20 rounded-lg border border-border-light bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  aria-label="Date of work"
                  className="rounded-lg border border-border-light bg-white px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <button type="submit" disabled={saving || !logHours} className="flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60">
                  <Clock size={13} /> Log time
                </button>
              </form>
            </div>

            {/* Activity log — from API */}
            <div className="rounded-xl border border-border-app bg-surface p-5">
              <h3 className="mb-3 font-display text-sm font-semibold text-ink flex items-center gap-2">
                <Activity size={15} />
                Activity
              </h3>
              {activityEntries.length > 0 ? (
                <ul className="space-y-3">
                  {activityEntries.map((entry) => (
                    <li key={entry.id} data-testid={`activity-${entry.id}`} className="flex items-start gap-2.5">
                      <span
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[8px] font-medium text-white"
                        style={{ backgroundColor: avatarColorForName(entry.actor?.fullName || 'Unknown') }}
                      >
                        {getInitials(entry.actor?.fullName || '?')}
                      </span>
                      <div>
                        <p className="text-sm text-ink">
                          <span className="font-medium">{entry.actor?.fullName || 'Unknown'}</span>
                          {' '}{formatActivityLine(entry)}
                        </p>
                        <p className="text-[11px] text-muted">{formatRelativeTime(entry.createdAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">No activity yet. Actions will appear here.</p>
              )}
            </div>

            {/* Attachments */}
            <div className="rounded-xl border border-border-app bg-surface p-5">
              <h3 className="mb-3 font-display text-sm font-semibold text-ink flex items-center gap-2">
                <Paperclip size={15} />
                Attachments
                {attachments.length > 0 && (
                  <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-muted">{attachments.length}</span>
                )}
              </h3>
              {attachments.length > 0 ? (
                <ul className="mb-3 space-y-2">
                  {attachments.map((att) => (
                    <li key={att.id} data-testid={`attachment-${att.id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-canvas/50">
                      <ExternalLink size={12} className="shrink-0 text-muted" />
                      <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-sm font-medium text-brand hover:underline">{att.fileName}</a>
                      <span className="text-[10px] text-muted">{att.addedBy?.fullName || 'Unknown'} · {formatRelativeTime(att.createdAt)}</span>
                      <button type="button" onClick={() => handleDeleteAttachment(att.id)} disabled={saving} className="rounded p-1 text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50" aria-label={`Delete attachment ${att.fileName}`}><Trash2 size={12} /></button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mb-3 text-sm text-muted">No attachments yet.</p>
              )}
              <form onSubmit={handleAddAttachment} className="flex gap-2">
                <input type="text" value={attachFileName} onChange={(e) => setAttachFileName(e.target.value)} placeholder="File name" aria-label="Attachment file name" className="w-1/3 rounded-lg border border-border-light bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                <input type="url" value={attachFileUrl} onChange={(e) => setAttachFileUrl(e.target.value)} placeholder="https://…" aria-label="Attachment URL" className="flex-1 rounded-lg border border-border-light bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                <button type="submit" disabled={saving || !attachFileName.trim() || !attachFileUrl.trim()} className="flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"><Plus size={13} /> Add</button>
              </form>
            </div>

            {/* Comments */}
            <div className="rounded-xl border border-border-app bg-surface p-5">
              <h3 className="mb-3 font-display text-sm font-semibold text-ink flex items-center gap-2">
                <MessageSquare size={15} />
                Comments
                {comments.length > 0 && (
                  <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-muted">{comments.length}</span>
                )}
              </h3>
              {comments.length > 0 ? (
                <ul className="mb-4 space-y-4">
                  {comments.map((comment) => (
                    <li key={comment.id} data-testid={`comment-${comment.id}`} className="flex items-start gap-2.5">
                      <span
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[9px] font-medium text-white"
                        style={{ backgroundColor: avatarColorForName(comment.author?.fullName || 'Unknown') }}
                      >
                        {getInitials(comment.author?.fullName || '?')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-ink">{comment.author?.fullName || 'Unknown'}</span>
                          <span className="text-[11px] text-muted">{formatRelativeTime(comment.createdAt)}</span>
                          <button type="button" onClick={() => handleDeleteComment(comment.id)} disabled={saving} className="ml-auto rounded p-1 text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50" aria-label={`Delete comment by ${comment.author?.fullName}`}><Trash2 size={11} /></button>
                        </div>
                        <p className="mt-0.5 text-sm text-ink/80 whitespace-pre-wrap">{comment.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mb-4 text-sm text-muted">No comments yet. Be the first to comment!</p>
              )}
              <form onSubmit={handlePostComment} className="flex gap-2">
                <textarea value={commentBody} onChange={(e) => setCommentBody(e.target.value)} placeholder="Write a comment…" aria-label="Write a comment" rows={2} className="flex-1 rounded-lg border border-border-light bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none" />
                <button type="submit" disabled={saving || !commentBody.trim()} className="self-end flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60" aria-label="Post comment"><Send size={13} /> Post</button>
              </form>
            </div>
          </div>

          {/* ─── Right Sidebar ───────────────────────────────── */}
          <div className="space-y-4">
            {/* Watch toggle */}
            <button
              type="button"
              onClick={handleToggleWatch}
              disabled={saving}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 ${
                watching
                  ? 'border-brand bg-brand/10 text-brand hover:bg-brand/20'
                  : 'border-border-app bg-surface text-ink hover:bg-canvas'
              }`}
              aria-label={watching ? 'Watching' : 'Watch'}
            >
              {watching ? <Eye size={15} /> : <EyeOff size={15} />}
              {watching ? 'Watching' : 'Watch'}
            </button>

            {/* Status */}
            <div className="rounded-xl border border-border-app bg-surface p-4">
              <h4 className="mb-2 font-mono text-[11px] tracking-wide text-muted uppercase">Status</h4>
              <div className="flex items-center gap-2 mb-2">
                <span className={`h-2.5 w-2.5 rounded-full ${sc!.dot}`} />
                <span className="text-sm font-medium text-ink">{sc!.label}</span>
              </div>
              {TRANSITIONS[task.status].length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {TRANSITIONS[task.status].map((target) => (
                    <button key={target} type="button" onClick={() => handleStatusChange(target)} disabled={saving} className="rounded-lg border border-border-app px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-canvas disabled:opacity-60">
                      → {STATUS_CONFIG[target].label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="rounded-xl border border-border-app bg-surface p-4">
              <h4 className="mb-3 font-mono text-[11px] tracking-wide text-muted uppercase">Details</h4>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Priority</dt>
                  <dd>
                    <select value={task.priority} onChange={(e) => handleFieldSave('priority', e.target.value)} disabled={saving} className="rounded border border-border-light bg-white px-2 py-1 text-xs text-ink disabled:opacity-60">
                      <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
                    </select>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Type</dt>
                  <dd>
                    <select value={task.type} onChange={(e) => handleFieldSave('type', e.target.value)} disabled={saving} className="rounded border border-border-light bg-white px-2 py-1 text-xs text-ink disabled:opacity-60">
                      <option value="TASK">Task</option><option value="BUG">Bug</option><option value="STORY">Story</option>
                    </select>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Assignee</dt>
                  <dd>
                    <select value={task.assigneeId ?? ''} onChange={(e) => handleFieldSave('assigneeId', e.target.value ? Number(e.target.value) : null)} disabled={saving} className="rounded border border-border-light bg-white px-2 py-1 text-xs text-ink disabled:opacity-60">
                      <option value="">Unassigned</option>
                      {members.map((m) => <option key={m.userId} value={m.userId}>{m.user.fullName}</option>)}
                    </select>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Due Date</dt>
                  <dd>
                    <input type="date" value={task.dueDate ? task.dueDate.split('T')[0] : ''} onChange={(e) => handleFieldSave('dueDate', e.target.value || null)} disabled={saving} className="rounded border border-border-light bg-white px-2 py-1 text-xs text-ink disabled:opacity-60" />
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Story Points</dt>
                  <dd>
                    <input type="number" min={0} value={task.storyPoints ?? ''} onChange={(e) => handleFieldSave('storyPoints', e.target.value ? Number(e.target.value) : null)} disabled={saving} placeholder="—" className="w-16 rounded border border-border-light bg-white px-2 py-1 text-xs text-ink disabled:opacity-60" />
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Epic</dt>
                  <dd>
                    <select value={task.epicId ?? ''} onChange={(e) => handleFieldSave('epicId', e.target.value ? Number(e.target.value) : null)} disabled={saving} className="rounded border border-border-light bg-white px-2 py-1 text-xs text-ink disabled:opacity-60">
                      <option value="">None</option>
                      {epics.map((ep) => <option key={ep.id} value={ep.id}>{ep.name}</option>)}
                    </select>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Sprint</dt>
                  <dd>
                    <select value={task.sprintId ?? ''} onChange={(e) => handleFieldSave('sprintId', e.target.value ? Number(e.target.value) : null)} disabled={saving} className="rounded border border-border-light bg-white px-2 py-1 text-xs text-ink disabled:opacity-60">
                      <option value="">None</option>
                      {sprints.map((sp) => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                    </select>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Labels */}
            <div className="rounded-xl border border-border-app bg-surface p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-mono text-[11px] tracking-wide text-muted uppercase">Labels</h4>
                <div className="relative">
                  <button type="button" onClick={() => setLabelPickerOpen(!labelPickerOpen)} className="text-muted hover:text-ink" title="Add/remove labels"><Plus size={14} /></button>
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
                              <button key={label.id} type="button" onClick={() => handleToggleLabel(label.id, isAttached)} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-ink transition-colors hover:bg-canvas">
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
                    <span key={label.id} className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: label.color }}>{label.name}</span>
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
