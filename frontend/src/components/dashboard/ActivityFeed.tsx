import { CheckCircle2, ArrowRightLeft, Plus, MessageSquare } from 'lucide-react';
import type { ActivityItem } from '../../data/types';
import { formatRelativeTime, getInitials, avatarColorForName } from '../../lib/utils';

const ACTION_META = {
  completed: { verb: 'completed', icon: CheckCircle2 },
  moved: { verb: 'moved', icon: ArrowRightLeft },
  created: { verb: 'created', icon: Plus },
  commented: { verb: 'commented on', icon: MessageSquare },
} as const;

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="rounded-xl border border-border-app bg-surface p-5">
      <h3 className="font-display text-base font-semibold text-ink">Recent activity</h3>

      <ul className="mt-4 space-y-4">
        {items.map((item) => {
          const { verb, icon: Icon } = ACTION_META[item.action];
          return (
            <li key={item.id} className="flex items-start gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-medium text-white"
                style={{ backgroundColor: avatarColorForName(item.actorName) }}
              >
                {getInitials(item.actorName)}
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-ink">
                  <span className="font-medium">{item.actorName}</span>{' '}
                  <span className="text-muted">{verb}</span>{' '}
                  <span className="font-medium">{item.targetTitle}</span>
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                  <Icon size={11} />
                  {formatRelativeTime(item.timestamp)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
