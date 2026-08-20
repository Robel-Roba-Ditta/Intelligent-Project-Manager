import type { TeamWorkload } from '../../../common/types/types';
import { getInitials, avatarColorForName } from '../../../common/lib/utils';

export function TeamWorkloadList({ workload }: { workload: TeamWorkload[] }) {
  const max = Math.max(...workload.map((w) => w.assignedTaskCount), 1);

  return (
    <div className="rounded-lg border border-border-app bg-surface p-5">
      <h3 className="font-display text-base font-semibold text-ink">Team workload</h3>
      <p className="text-sm text-muted">Open tasks per person</p>

      <ul className="mt-4 space-y-3.5">
        {workload.map((member) => (
          <li key={member.memberId} className="flex items-center gap-3">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-medium text-white"
              style={{ backgroundColor: avatarColorForName(member.memberName) }}
            >
              {getInitials(member.memberName)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate text-ink">{member.memberName}</span>
                <span className="ml-2 shrink-0 text-muted">{member.assignedTaskCount}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
                <div
                  className="h-full rounded-full bg-brand/70"
                  style={{ width: `${(member.assignedTaskCount / max) * 100}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
