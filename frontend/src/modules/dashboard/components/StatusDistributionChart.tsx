import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { TaskStatus } from '../../../common/types/types';

const STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: 'To Do', color: '#9a9db3' },
  in_progress: { label: 'In Progress', color: '#e8a33d' },
  in_review: { label: 'In Review', color: '#6366f1' },
  done: { label: 'Done', color: '#1f9d7c' },
};

export function StatusDistributionChart({
  tasksByStatus,
}: {
  tasksByStatus: Record<TaskStatus, number>;
}) {
  const total = Object.values(tasksByStatus).reduce((a, b) => a + b, 0);
  const data = (Object.keys(tasksByStatus) as TaskStatus[]).map((status) => ({
    status,
    label: STATUS_META[status].label,
    value: tasksByStatus[status],
    color: STATUS_META[status].color,
  }));

  return (
    <div className="overflow-hidden rounded-xl border border-border-app bg-surface p-5">
      <h3 className="font-display text-base font-semibold text-ink">Tasks by status</h3>
      <p className="text-sm text-muted">{total} tasks across all active projects</p>

      <div className="mt-2 flex items-center gap-4">
        <div className="h-36 w-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                innerRadius={40}
                outerRadius={64}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.status} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, _name, entry) => [`${value} tasks`, entry?.payload?.label]}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #e2e8f4',
                  fontSize: 13,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="flex-1 space-y-2.5">
          {data.map((entry) => (
            <li key={entry.status} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-ink">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.label}
              </span>
              <span className="font-medium text-muted">{entry.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
