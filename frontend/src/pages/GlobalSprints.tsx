import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { getMyActiveSprints, type SprintDto } from '../lib/sprintsApi';
import { extractErrorMessage } from '../lib/api';
import { AlertCircle, Rocket, Calendar, ArrowRight } from 'lucide-react';

export function GlobalSprints() {
  const [sprints, setSprints] = useState<SprintDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSprints() {
      try {
        setError(null);
        const data = await getMyActiveSprints();
        setSprints(data);
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    fetchSprints();
  }, []);

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Active Sprints</h1>
        <p className="text-sm text-muted">Currently running sprints across your projects.</p>
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
      ) : sprints.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {sprints.map((sprint) => {
            const projectName = sprint.project?.name || `Project #${sprint.projectId}`;
            return (
              <div
                key={sprint.id}
                className="flex flex-col rounded-xl border border-border-app bg-surface p-5 transition-all hover:border-brand/30 hover:shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded bg-brand/10 px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide text-brand uppercase">
                        Active
                      </span>
                      <span className="text-xs font-medium text-muted">{projectName}</span>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-ink">{sprint.name}</h3>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas text-muted">
                    <Rocket size={20} strokeWidth={1.5} />
                  </div>
                </div>

                <div className="mb-6 flex-1">
                  <p className="text-sm text-ink/80 line-clamp-3">
                    {sprint.goal || <span className="italic text-muted">No goal defined</span>}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-border-app pt-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <Calendar size={13} />
                    {sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : '—'}
                    {' → '}
                    {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : '—'}
                  </div>
                  <Link
                    to={`/projects/${sprint.projectId}?tab=board`}
                    className="flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-dark"
                  >
                    Go to Board <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-app bg-surface p-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-canvas text-muted">
            <Rocket size={24} />
          </div>
          <h3 className="mb-1 font-display text-lg font-semibold text-ink">No Active Sprints</h3>
          <p className="text-sm text-muted">You don't have any active sprints in your projects right now.</p>
        </div>
      )}
    </AppShell>
  );
}
