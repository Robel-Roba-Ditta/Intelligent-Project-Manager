import { useState, useEffect, type FormEvent } from 'react';
import { AlertCircle, Plus, Pencil, Trash2, X, Play, CheckCircle, BarChart3 } from 'lucide-react';
import {
  listSprints,
  createSprint,
  updateSprint,
  deleteSprint,
  startSprint,
  completeSprint,
  type SprintDto,
  type SprintStatus,
} from '../../sprint/api/sprintsApi';
import { extractErrorMessage } from '../../../common/lib/api';
import { BurndownChart } from './BurndownChart';

const STATUS_CONFIG: Record<SprintStatus, { label: string; dot: string; bg: string; text: string }> = {
  PLANNED: { label: 'Planned', dot: 'bg-slate-400', bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600' },
  ACTIVE: { label: 'Active', dot: 'bg-blue-500', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  COMPLETED: { label: 'Completed', dot: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function SprintsPanel({ projectId }: { projectId: number }) {
  const [sprints, setSprints] = useState<SprintDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [expandedBurndown, setExpandedBurndown] = useState<number | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');

  async function load() {
    try {
      setError(null);
      const data = await listSprints(projectId);
      setSprints(data);
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
    setGoal('');
    setShowForm(true);
  }

  function openEdit(sprint: SprintDto) {
    setEditingId(sprint.id);
    setName(sprint.name);
    setGoal(sprint.goal ?? '');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (editingId) {
        await updateSprint(editingId, { name, goal: goal || undefined });
      } else {
        await createSprint(projectId, { name, goal: goal || undefined });
      }
      closeForm();
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleStart(id: number) {
    setError(null);
    setBusy(true);
    try {
      await startSprint(id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete(id: number) {
    setError(null);
    setBusy(true);
    try {
      await completeSprint(id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: number, sprintName: string) {
    if (!window.confirm(`Delete sprint "${sprintName}"?`)) return;
    setError(null);
    setBusy(true);
    try {
      await deleteSprint(id);
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
          {sprints.length} {sprints.length === 1 ? 'sprint' : 'sprints'}
        </h3>
        {!showForm && (
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-dark"
          >
            <Plus size={14} />
            New Sprint
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
              {editingId ? 'Edit Sprint' : 'New Sprint'}
            </h4>
            <button type="button" onClick={closeForm} className="text-muted hover:text-ink">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="sprint-name" className="mb-1.5 block font-mono text-[11px] tracking-wide text-muted uppercase">
                Name
              </label>
              <input
                id="sprint-name"
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sprint name"
                className="w-full rounded-lg border border-border-light bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label htmlFor="sprint-goal" className="mb-1.5 block font-mono text-[11px] tracking-wide text-muted uppercase">
                Goal (optional)
              </label>
              <textarea
                id="sprint-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What should this sprint achieve?"
                rows={2}
                className="w-full rounded-lg border border-border-light bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editingId ? 'Save' : 'Create'}
            </button>
          </form>
        </div>
      )}

      {/* Sprints list */}
      {sprints.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-border-app py-10 text-center">
          <p className="text-sm text-muted">No sprints yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sprints.map((sprint) => {
            const sc = STATUS_CONFIG[sprint.status];
            return (
              <div
                key={sprint.id}
                className="rounded-xl border border-border-app bg-surface p-4 transition-colors hover:border-border-light"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${sc.dot}`} />
                      <p className="truncate text-sm font-medium text-ink">{sprint.name}</p>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${sc.bg} ${sc.text}`}
                      >
                        {sc.label}
                      </span>
                    </div>
                    {sprint.goal && (
                      <p className="mt-1 text-xs text-muted">{sprint.goal}</p>
                    )}
                    <div className="mt-2 flex gap-4 text-[11px] text-muted">
                      <span>Start: {formatDate(sprint.startDate)}</span>
                      <span>End: {formatDate(sprint.endDate)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {sprint.status === 'PLANNED' && (
                      <button
                        type="button"
                        onClick={() => handleStart(sprint.id)}
                        disabled={busy}
                        title="Start sprint"
                        className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
                      >
                        <Play size={12} />
                        Start
                      </button>
                    )}
                    {sprint.status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => handleComplete(sprint.id)}
                        disabled={busy}
                        title="Complete sprint"
                        className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                      >
                        <CheckCircle size={12} />
                        Complete
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEdit(sprint)}
                      title="Edit"
                      disabled={busy}
                      className="rounded-lg p-1.5 text-muted transition-colors hover:bg-canvas hover:text-ink disabled:opacity-50"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(sprint.id, sprint.name)}
                      title="Delete"
                      disabled={busy}
                      className="rounded-lg p-1.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Burndown toggle for active/completed sprints */}
                {(sprint.status === 'ACTIVE' || sprint.status === 'COMPLETED') && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setExpandedBurndown(expandedBurndown === sprint.id ? null : sprint.id)}
                      className="mt-2 flex items-center gap-1.5 text-xs font-medium text-brand transition-colors hover:text-brand-dark"
                    >
                      <BarChart3 size={13} />
                      {expandedBurndown === sprint.id ? 'Hide Burndown' : 'Show Burndown'}
                    </button>
                    {expandedBurndown === sprint.id && (
                      <BurndownChart sprintId={sprint.id} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
