import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { getSprintBurndown, type BurndownData } from '../../lib/sprintsApi';
import { extractErrorMessage } from '../../lib/api';
import { AlertCircle, TrendingDown } from 'lucide-react';

export function BurndownChart({ sprintId }: { sprintId: number }) {
  const [data, setData] = useState<BurndownData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        setLoading(true);
        const burndown = await getSprintBurndown(sprintId);
        setData(burndown);
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sprintId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted">
        Loading burndown…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (!data || data.days.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-muted">No burndown data available</p>
    );
  }

  // Format date labels to short format (e.g., "Aug 1")
  const chartData = data.days.map((d) => ({
    ...d,
    label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <div className="mt-3 rounded-lg border border-border-app bg-canvas/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <TrendingDown size={15} className="text-brand" />
        <h4 className="text-sm font-semibold text-ink">Sprint Burndown</h4>
        <span className="text-xs text-muted">
          {data.totalTasks} total tasks · {data.startDate} → {data.endDate}
        </span>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e2e8f4" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#6c7086' }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#6c7086' }}
              allowDecimals={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e2e8f4',
                fontSize: 13,
              }}
              formatter={(value: any, name: any) => [
                `${value} tasks`,
                name === 'idealRemaining' ? 'Ideal' : 'Actual',
              ]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend
              formatter={(value) =>
                value === 'idealRemaining' ? 'Ideal' : 'Actual'
              }
              iconType="line"
              wrapperStyle={{ fontSize: 12 }}
            />
            <Line
              type="linear"
              dataKey="idealRemaining"
              stroke="#9a9db3"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="actualRemaining"
              stroke="#0c66e4"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#0c66e4' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
