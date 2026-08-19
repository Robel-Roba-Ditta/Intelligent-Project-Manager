import { useState, useEffect, type FormEvent } from 'react';
import { AlertCircle, Plus, Trash2, X } from 'lucide-react';
import {
  listLabels,
  createLabel,
  deleteLabel,
  type LabelDto,
} from '../api/labelsApi';
import { extractErrorMessage } from '../../../common/lib/api';

export function LabelsManager({ projectId, onClose }: { projectId: number; onClose?: () => void }) {
  const [labels, setLabels] = useState<LabelDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setError(null);
      setLabels(await listLabels(projectId));
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await createLabel(projectId, { name, color });
      setName('');
      setColor('#6366f1');
      setShowForm(false);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: number, labelName: string) {
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

  return (
    <div className="rounded-xl border border-border-app bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-ink">Labels</h3>
        <div className="flex items-center gap-2">
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-dark"
            >
              <Plus size={14} />
              New Label
            </button>
          )}
          {onClose && (
            <button type="button" onClick={onClose} className="text-muted hover:text-ink">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-3 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 flex items-end gap-3 rounded-lg border border-border-light bg-canvas/50 p-3">
          <div className="flex-1">
            <label htmlFor="label-name" className="mb-1.5 block font-mono text-[11px] tracking-wide text-muted uppercase">Name</label>
            <input
              id="label-name"
              type="text"
              required
              minLength={1}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Label name"
              className="w-full rounded-lg border border-border-light bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label htmlFor="label-color" className="mb-1.5 block font-mono text-[11px] tracking-wide text-muted uppercase">Color</label>
            <input
              id="label-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-[38px] w-12 cursor-pointer rounded-lg border border-border-light"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => { setShowForm(false); setName(''); }}
            className="rounded-lg px-3 py-2 text-sm text-muted hover:text-ink"
          >
            Cancel
          </button>
        </form>
      )}

      {labels.length === 0 && !showForm ? (
        <p className="py-6 text-center text-sm text-muted">No labels yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {labels.map((label) => (
            <li
              key={label.id}
              className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-canvas/50"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-3.5 w-3.5 rounded-full border border-white/20"
                  style={{ backgroundColor: label.color }}
                />
                <span className="text-sm font-medium text-ink">{label.name}</span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(label.id, label.name)}
                disabled={busy}
                className="rounded-lg p-1.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
