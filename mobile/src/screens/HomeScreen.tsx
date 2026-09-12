import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle as SvgCircle, Rect, G, Text as SvgText } from 'react-native-svg';
import { getDashboard } from '@ipm/shared';
import type {
  DashboardData,
  DashboardTask,
  DashboardProject,
  TeamWorkload,
  ActivityItem,
  WeeklyTrendPoint,
} from '@ipm/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_SIZE = 140;

const STATUS_COLORS: Record<string, string> = {
  todo: '#94a3b8',
  in_progress: '#3b82f6',
  in_review: '#a855f7',
  done: '#10b981',
};
const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
};
const PRIORITY_COLORS: Record<string, string> = {
  low: '#64748b',
  medium: '#1d4ed8',
  high: '#b45309',
  urgent: '#dc2626',
};
const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

function DonutChart({ data, colors, labels, title }: {
  data: Record<string, number>;
  colors: Record<string, string>;
  labels: Record<string, string>;
  title: string;
}) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  if (total === 0) return <Text style={styles.muted}>No data</Text>;

  const cx = CHART_SIZE / 2;
  const cy = CHART_SIZE / 2;
  const r = 50;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const arcs = entries.map(([key, value]) => {
    const pct = value / total;
    const dashArray = `${pct * circumference} ${circumference}`;
    const rotation = offset * 360 - 90;
    offset += pct;
    return { key, color: colors[key] || '#ccc', dashArray, rotation };
  });

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.chartRow}>
        <Svg width={CHART_SIZE} height={CHART_SIZE}>
          {arcs.map(a => (
            <SvgCircle
              key={a.key}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={strokeWidth}
              strokeDasharray={a.dashArray}
              strokeLinecap="butt"
              transform={`rotate(${a.rotation} ${cx} ${cy})`}
            />
          ))}
          <SvgText x={cx} y={cy + 4} textAnchor="middle" fontSize="18" fontWeight="bold" fill="#1a1a1a">{total}</SvgText>
        </Svg>
        <View style={styles.chartLegend}>
          {entries.map(([key, value]) => (
            <View key={key} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: colors[key] }]} />
              <Text style={styles.legendLabel}>{labels[key] || key}</Text>
              <Text style={styles.legendValue}>{value}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function BarChart({ data }: { data: WeeklyTrendPoint[] }) {
  if (!data.length) return <Text style={styles.muted}>No trend data</Text>;
  const max = Math.max(...data.map(d => d.completed), 1);
  const barWidth = Math.min(28, (SCREEN_WIDTH - 100) / data.length - 6);
  const chartHeight = 100;

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Weekly Trend</Text>
      <View style={styles.barChartContainer}>
        {data.map((point, i) => {
          const h = (point.completed / max) * chartHeight;
          return (
            <View key={i} style={styles.barCol}>
              <Text style={styles.barValue}>{point.completed}</Text>
              <View style={[styles.bar, { height: h, width: barWidth, backgroundColor: '#0C66E4' }]} />
              <Text style={styles.barLabel}>{point.day.slice(0, 3)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try { setData(await getDashboard(api)); }
    catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchDashboard(); }, [fetchDashboard]);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#0C66E4" /></View>;

  const firstName = user?.fullName.split(' ')[0] ?? '';
  const stats = data?.stats;
  const sprint = data?.sprint;

  function formatRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  function formatActivityAction(a: ActivityItem): string {
    switch (a.action) {
      case 'moved': return `moved "${a.targetTitle}"`;
      case 'completed': return `completed "${a.targetTitle}"`;
      case 'created': return `created "${a.targetTitle}"`;
      case 'commented': return `commented on "${a.targetTitle}"`;
      default: return `${a.action} "${a.targetTitle}"`;
    }
  }

  function avatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#0ea5e9', '#14b8a6', '#059669'];
    return colors[Math.abs(hash) % colors.length];
  }

  function getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'tomorrow';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function priorityStyle(p: string): object {
    switch (p) {
      case 'urgent': return { backgroundColor: '#fef2f2', borderColor: '#fecaca' };
      case 'high': return { backgroundColor: '#fff7ed', borderColor: '#fed7aa' };
      case 'medium': return { backgroundColor: '#fffbeb', borderColor: '#fde68a' };
      default: return { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' };
    }
  }

  return (
    <ScrollView
      style={styles.list}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0C66E4" />}
    >
      {/* Header with search */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Hi, {firstName} 👋</Text>
          <Text style={styles.greetingSub}>Here's your overview</Text>
        </View>
        <TouchableOpacity style={styles.searchIcon} onPress={() => navigation.navigate('Search')}>
          <Text style={styles.searchIconText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Stat cards — 2x2 grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderLeftColor: '#0C66E4' }]}>
          <Text style={[styles.statNumber, { color: '#0C66E4' }]}>{stats?.activeProjects ?? 0}</Text>
          <Text style={styles.statLabel}>Active Projects</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#f97316' }]}>
          <Text style={[styles.statNumber, { color: '#f97316' }]}>{stats?.openTasks ?? 0}</Text>
          <Text style={styles.statLabel}>Open Tasks</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats?.completedThisSprint ?? 0}</Text>
          <Text style={styles.statLabel}>Done This Sprint</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#dc2626' }]}>
          <Text style={[styles.statNumber, { color: '#dc2626' }]}>{stats?.overdueTasks ?? 0}</Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
      </View>

      {/* Sprint progress */}
      {sprint && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Sprint: {sprint.name}</Text>
          {sprint.goal ? <Text style={styles.sprintGoal}>{sprint.goal}</Text> : null}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${sprint.totalTasks > 0 ? (sprint.completedTasks / sprint.totalTasks * 100) : 0}%` }]} />
          </View>
          <Text style={styles.progressText}>{sprint.completedTasks} / {sprint.totalTasks} tasks complete</Text>
        </View>
      )}

      {/* Status distribution donut */}
      {data?.tasksByStatus && (
        <DonutChart data={data.tasksByStatus} colors={STATUS_COLORS} labels={STATUS_LABELS} title="Status Distribution" />
      )}

      {/* Priority distribution donut */}
      {data?.tasksByPriority && (
        <DonutChart data={data.tasksByPriority} colors={PRIORITY_COLORS} labels={PRIORITY_LABELS} title="Priority Distribution" />
      )}

      {/* Weekly trend bar chart */}
      {data?.weeklyTrend && <BarChart data={data.weeklyTrend} />}

      {/* My Tasks */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>My Tasks ({data?.myTasks.length ?? 0})</Text>
        {(data?.myTasks ?? []).length === 0 && <Text style={styles.muted}>No tasks assigned to you</Text>}
        {(data?.myTasks ?? []).map(t => (
          <View key={t.id} style={styles.taskRow}>
            <View style={styles.taskRowLeft}>
              <View style={[styles.dot, { backgroundColor: STATUS_COLORS[t.status] ?? '#94a3b8' }]} />
              <Text style={styles.taskRowTitle} numberOfLines={1}>{t.title}</Text>
            </View>
            <View style={[styles.prBadge, priorityStyle(t.priority)]}>
              <Text style={styles.prBadgeText}>{t.priority}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Team Workload */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Team Workload</Text>
        {(data?.teamWorkload ?? []).length === 0 && <Text style={styles.muted}>No data</Text>}
        {(data?.teamWorkload ?? []).map(m => {
          const maxTasks = Math.max(...(data?.teamWorkload ?? []).map(w => w.assignedTaskCount), 1);
          const pct = (m.assignedTaskCount / maxTasks) * 100;
          return (
            <View key={m.memberId} style={styles.workloadRow}>
              <View style={[styles.workloadAvatar, { backgroundColor: avatarColor(m.memberName) }]}>
                <Text style={styles.workloadAvatarText}>{getInitials(m.memberName)}</Text>
              </View>
              <View style={styles.workloadInfo}>
                <Text style={styles.workloadName}>{m.memberName}</Text>
                <View style={styles.workloadBarBg}>
                  <View style={[styles.workloadBarFill, { width: `${pct}%` }]} />
                </View>
              </View>
              <Text style={styles.workloadCount}>{m.assignedTaskCount}</Text>
            </View>
          );
        })}
      </View>

      {/* Projects Overview */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Projects Overview</Text>
        {(data?.projects ?? []).length === 0 && <Text style={styles.muted}>No projects</Text>}
        {(data?.projects ?? []).map(p => {
          const pct = p.totalTasks > 0 ? (p.completedTasks / p.totalTasks * 100) : 0;
          return (
            <View key={p.id} style={styles.projectRow}>
              <View style={styles.projectInfo}>
                <Text style={styles.projectName}>{p.name}</Text>
                <Text style={styles.projectMeta}>{p.completedTasks}/{p.totalTasks} tasks</Text>
              </View>
              <View style={styles.projectBarBg}>
                <View style={[styles.projectBarFill, { width: `${pct}%` }]} />
              </View>
            </View>
          );
        })}
      </View>

      {/* Recent Activity */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {(data?.activity ?? []).length === 0 && <Text style={styles.muted}>No recent activity</Text>}
        {(data?.activity ?? []).map(a => (
          <View key={a.id} style={styles.activityRow}>
            <View style={[styles.activityAvatar, { backgroundColor: avatarColor(a.actorName) }]}>
              <Text style={styles.activityAvatarText}>{getInitials(a.actorName)}</Text>
            </View>
            <View style={styles.activityBody}>
              <Text style={styles.activityLine}>
                <Text style={styles.activityActor}>{a.actorName}</Text>{' '}
                {formatActivityAction(a)}
              </Text>
              <Text style={styles.activityTime}>{formatRelativeTime(a.timestamp)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f9fafb' },
  listContent: { padding: 20, paddingTop: 56 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  greetingSub: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  searchIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  searchIconText: { fontSize: 18 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { width: (SCREEN_WIDTH - 50) / 2, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  statNumber: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 4, fontWeight: '500' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 10 },
  muted: { fontSize: 13, color: '#9ca3af' },
  sprintGoal: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  progressBarBg: { height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressBarFill: { height: '100%', backgroundColor: '#0C66E4', borderRadius: 4 },
  progressText: { fontSize: 12, color: '#6b7280' },
  chartCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  chartTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 },
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  chartLegend: { flex: 1 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, color: '#374151', flex: 1 },
  legendValue: { fontSize: 12, fontWeight: '600', color: '#1a1a1a' },
  barChartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingTop: 8 },
  barCol: { alignItems: 'center', gap: 4 },
  barValue: { fontSize: 10, color: '#6b7280', fontWeight: '600' },
  bar: { borderRadius: 4 },
  barLabel: { fontSize: 10, color: '#9ca3af' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  taskRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  taskRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  taskRowTitle: { fontSize: 14, color: '#1a1a1a', fontWeight: '500', flex: 1 },
  prBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  prBadgeText: { fontSize: 10, fontWeight: '600', color: '#374151', textTransform: 'capitalize' },
  workloadRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  workloadAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  workloadAvatarText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  workloadInfo: { flex: 1 },
  workloadName: { fontSize: 13, color: '#1a1a1a', fontWeight: '500', marginBottom: 4 },
  workloadBarBg: { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' },
  workloadBarFill: { height: '100%', backgroundColor: '#0C66E4', borderRadius: 3 },
  workloadCount: { fontSize: 14, fontWeight: '600', color: '#0C66E4', minWidth: 24, textAlign: 'right' },
  projectRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  projectInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  projectName: { fontSize: 14, fontWeight: '500', color: '#1a1a1a' },
  projectMeta: { fontSize: 12, color: '#6b7280' },
  projectBarBg: { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' },
  projectBarFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 3 },
  activityRow: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  activityAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  activityAvatarText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  activityBody: { flex: 1 },
  activityLine: { fontSize: 13, color: '#374151' },
  activityActor: { fontWeight: '600', color: '#1a1a1a' },
  activityTime: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
});
