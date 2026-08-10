import { FolderKanban, ListChecks, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/layout/AppShell';
import { StatCard } from '../components/dashboard/StatCard';
import { SprintProgressCard } from '../components/dashboard/SprintProgressCard';
import { StatusDistributionChart } from '../components/dashboard/StatusDistributionChart';
import { WeeklyTrendChart } from '../components/dashboard/WeeklyTrendChart';
import { MyTasksList } from '../components/dashboard/MyTasksList';
import { TeamWorkloadList } from '../components/dashboard/TeamWorkloadList';
import { ProjectsOverview } from '../components/dashboard/ProjectsOverview';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { getDashboardData } from '../data/mockDashboard';

export function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;

  const data = getDashboardData(user.fullName);
  const firstName = user.fullName.split(' ')[0];

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
          <SprintProgressCard sprint={data.sprint} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatusDistributionChart tasksByStatus={data.tasksByStatus} />
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
