import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { TaskPriority } from '../../../common/types/types';

const PRIORITY_META: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: '#6c7086' },
  medium: { label: 'Medium', color: '#e8a33d' },
  high: { label: 'High', color: '#e0720c' },
  urgent: { label: 'Urgent', color: '#d64545' },
};

export function PriorityDistributionChart({
  tasksByPriority,
}: {
  tasksByPriority: Record<TaskPriority, number>;
}) {
  const total = Object.values(tasksByPriority).reduce((a, b) => a + b, 0);
  const data = (Object.keys(tasksByPriority) as TaskPriority[]).map((priority) => ({
    priority,
    label: PRIORITY_META[priority].label,
    value: tasksByPriority[priority],
    color: PRIORITY_META[priority].color,
  }));

  return (
    <div className="overflow-hidden rounded-lg border border-border-app bg-surface p-5">
      <h3 className="font-display text-base font-semibold text-ink">Tasks by priority</h3>
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
                  <Cell key={entry.priority} fill={entry.color} />
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
            <li key={entry.priority} className="flex items-center justify-between text-sm">
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
