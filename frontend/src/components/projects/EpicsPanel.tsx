import { useState, useEffect, type FormEvent } from 'react';
import { AlertCircle, Plus, Pencil, Trash2, X } from 'lucide-react';
import {
  listEpics,
  createEpic,
  updateEpic,
  deleteEpic,
  type EpicDto,
  type EpicStatus,
} from '../../lib/epicsApi';
import { extractErrorMessage } from '../../lib/api';

const STATUS_CONFIG: Record<EpicStatus, { label: string; dot: string; bg: string; text: string }> = {
  OPEN: { label: 'Open', dot: 'bg-blue-500', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  IN_PROGRESS: { label: 'In Progress', dot: 'bg-amber-500', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  DONE: { label: 'Done', dot: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
};

export function EpicsPanel({ projectId }: { projectId: number }) {
  const [epics, setEpics] = useState<EpicDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<EpicStatus>('OPEN');

  async function load() {
    try {
      setError(null);
      const data = await listEpics(projectId);
      setEpics(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  useEffect(() => {
    load();
  }, [projectId]);

  function openCreate() {
    setEditingId(null);
    setName('');
    setDescription('');
    setStatus('OPEN');
    setShowForm(true);
  }

  function openEdit(epic: EpicDto) {
    setEditingId(epic.id);
    setName(epic.name);
    setDescription(epic.description ?? '');
    setStatus(epic.status);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setDescription('');
    setStatus('OPEN');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (editingId) {
        await updateEpic(editingId, { name, description: description || undefined, status });
      } else {
        await createEpic(projectId, { name, description: description || undefined, status });
      }
      closeForm();
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: number, epicName: string) {
    if (!window.confirm(`Delete epic "${epicName}"?`)) return;
    setError(null);
    setBusy(true);
    try {
      await deleteEpic(id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-ink">
          {epics.length} {epics.length === 1 ? 'epic' : 'epics'}
        </h3>
        {!showForm && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-dark"
          >
            <Plus size={14} />
            New Epic
          </button>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Create / Edit form */}
      {showForm && (
        <div className="rounded-xl border border-border-app bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-display text-sm font-semibold text-ink">
              {editingId ? 'Edit Epic' : 'New Epic'}
            </h4>
            <button type="button" onClick={closeForm} className="text-muted hover:text-ink">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="epic-name" className="mb-1.5 block font-mono text-[11px] tracking-wide text-muted uppercase">
                Name
              </label>
              <input
                id="epic-name"
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Epic name"
                className="w-full rounded-lg border border-border-light bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label htmlFor="epic-desc" className="mb-1.5 block font-mono text-[11px] tracking-wide text-muted uppercase">
                Description
              </label>
              <textarea
                id="epic-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Optional description"
                className="w-full rounded-lg border border-border-light bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div className="flex items-end gap-3">
              <div>
                <label htmlFor="epic-status" className="mb-1.5 block font-mono text-[11px] tracking-wide text-muted uppercase">
                  Status
                </label>
                <select
                  id="epic-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EpicStatus)}
                  className="rounded-lg border border-border-light bg-white px-3 py-[9px] text-sm text-ink"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {editingId ? 'Save' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Epics list */}
      {epics.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-border-app py-10 text-center">
          <p className="text-sm text-muted">No epics yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border-app bg-surface">
          <ul className="divide-y divide-border-app">
            {epics.map((epic) => {
              const sc = STATUS_CONFIG[epic.status];
              return (
                <li
                  key={epic.id}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-canvas/50"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${sc.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{epic.name}</p>
                    {epic.description && (
                      <p className="mt-0.5 truncate text-xs text-muted">{epic.description}</p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.text}`}
                  >
                    {sc.label}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(epic)}
                      title="Edit"
                      disabled={busy}
                      className="rounded-lg p-1.5 text-muted transition-colors hover:bg-canvas hover:text-ink disabled:opacity-50"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(epic.id, epic.name)}
                      title="Delete"
                      disabled={busy}
                      className="rounded-lg p-1.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
