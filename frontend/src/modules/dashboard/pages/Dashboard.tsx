import { useEffect, useState } from 'react';
import { FolderKanban, ListChecks, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../common/context/AuthContext';
import { AppShell } from '../../../common/components/layout/AppShell';
import { StatCard } from '../components/StatCard';
import { SprintProgressCard } from '../components/SprintProgressCard';
import { StatusDistributionChart } from '../components/StatusDistributionChart';
import { PriorityDistributionChart } from '../components/PriorityDistributionChart';
import { WeeklyTrendChart } from '../components/WeeklyTrendChart';
import { MyTasksList } from '../components/MyTasksList';
import { TeamWorkloadList } from '../components/TeamWorkloadList';
import { ProjectsOverview } from '../components/ProjectsOverview';
import { ActivityFeed } from '../components/ActivityFeed';
import { api } from '../../../common/lib/api';
import type { DashboardData } from '../../../common/types/types';

export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<DashboardData>('/dashboard');
        if (!cancelled) setData(res.data);
      } catch {
        
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) return null;

  const firstName = user.fullName.split(' ')[0];

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-40 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-app border-t-brand" />
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return (
      <AppShell>
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-ink">
            Welcome back, {firstName}.
          </h1>
          <p className="text-sm text-muted">Could not load dashboard data.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Welcome back, {firstName}.
        </h1>
        <p className="text-sm text-muted">Here's what's happening across your projects.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Projects" value={data.stats.activeProjects} icon={FolderKanban} tone="brand" />
        <StatCard label="Open Tasks" value={data.stats.openTasks} icon={ListChecks} tone="progress" />
        <StatCard label="Completed This Sprint" value={data.stats.completedThisSprint} icon={CheckCircle2} tone="done" />
        <StatCard
          label="Overdue Tasks"
          value={data.stats.overdueTasks}
          hint={data.stats.overdueTasks > 0 ? 'Needs attention' : undefined}
          icon={AlertTriangle}
          tone="danger"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {data.sprint ? (
            <SprintProgressCard sprint={data.sprint} />
          ) : (
            <div className="rounded-lg border border-border-app bg-surface p-5">
              <p className="text-sm text-muted">No active sprint.</p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatusDistributionChart tasksByStatus={data.tasksByStatus} />
            <PriorityDistributionChart tasksByPriority={data.tasksByPriority} />
            <WeeklyTrendChart data={data.weeklyTrend} />
          </div>
          <MyTasksList tasks={data.myTasks} />
        </div>
        <div className="space-y-4">
          <TeamWorkloadList workload={data.teamWorkload} />
          <ProjectsOverview projects={data.projects} />
          <ActivityFeed items={data.activity} />
        </div>
      </div>
    </AppShell>
  );
}
