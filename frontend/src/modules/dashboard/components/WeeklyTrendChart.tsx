import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import type { WeeklyTrendPoint } from '../../../common/types/types';

export function WeeklyTrendChart({ data }: { data: WeeklyTrendPoint[] }) {
  const totalCompleted = data.reduce((sum, d) => sum + d.completed, 0);

  return (
    <div className="rounded-xl border border-border-app bg-surface p-5">
      <h3 className="font-display text-base font-semibold text-ink">Completed this week</h3>
      <p className="text-sm text-muted">{totalCompleted} tasks closed across the team</p>

      <div className="mt-3 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e2e8f4" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6c7086' }}
            />
            <Tooltip
              cursor={{ fill: '#f4f7fc' }}
              formatter={(value) => [`${value} tasks`, 'Completed']}
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f4', fontSize: 13 }}
            />
            <Bar dataKey="completed" fill="#0c66e4" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
