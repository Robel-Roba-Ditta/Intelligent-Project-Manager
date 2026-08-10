import { Rocket } from 'lucide-react';
import type { Sprint } from '../../data/types';

function formatDateRange(startIso: string, endIso: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const start = new Date(`${startIso}T00:00:00`).toLocaleDateString('en-US', opts);
  const end = new Date(`${endIso}T00:00:00`).toLocaleDateString('en-US', opts);
  return `${start} – ${end}`;
}

function daysRemaining(endIso: string): number {
  const end = new Date(`${endIso}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((end.getTime() - today.getTime()) / 86_400_000));
}

export function SprintProgressCard({ sprint }: { sprint: Sprint }) {
  const percent = Math.round((sprint.completedPoints / sprint.plannedPoints) * 100);
  const remaining = daysRemaining(sprint.endDate);

  return (
    <div className="rounded-xl border border-border-app bg-surface p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-brand-light text-brand-dark">
              <Rocket size={13} />
            </span>
            <h3 className="font-display text-base font-semibold text-ink">{sprint.name}</h3>
          </div>
          <p className="mt-1 text-sm text-muted">{sprint.goal}</p>
        </div>
        <span className="shrink-0 font-mono text-xs text-muted">
          {formatDateRange(sprint.startDate, sprint.endDate)}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium text-ink">
            {sprint.completedPoints}
            <span className="text-muted"> / {sprint.plannedPoints} points</span>
          </span>
          <span className="text-muted">{remaining} days left</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-canvas">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
