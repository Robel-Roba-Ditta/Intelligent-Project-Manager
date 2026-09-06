import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { getDashboard } from '@ipm/shared';
import type { DashboardData, DashboardTask } from '@ipm/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const result = await getDashboard(api);
      setData(result);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0C66E4" />
      </View>
    );
  }

  const firstName = user?.fullName.split(' ')[0] ?? '';
  const stats = data?.stats;
  const myTasks = data?.myTasks ?? [];

  const renderTaskItem = ({ item }: { item: DashboardTask }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle} numberOfLines={1}>{item.title}</Text>
        <View style={[styles.priorityBadge, priorityColor(item.priority)]}>
          <Text style={styles.priorityText}>{item.priority}</Text>
        </View>
      </View>
      <View style={styles.taskMeta}>
        <Text style={styles.taskProject} numberOfLines={1}>{item.projectName}</Text>
        {item.dueDate && (
          <Text style={styles.taskDue}>Due {formatDate(item.dueDate)}</Text>
        )}
      </View>
    </View>
  );

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={myTasks}
      keyExtractor={(item) => item.id}
      renderItem={renderTaskItem}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0C66E4" />
      }
      ListHeaderComponent={
        <View>
          <Text style={styles.greeting}>Hi, {firstName} 👋</Text>
          <Text style={styles.greetingSub}>Here's your overview</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats?.openTasks ?? 0}</Text>
              <Text style={styles.statLabel}>Open Tasks</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, styles.statOverdue]}>
                {stats?.overdueTasks ?? 0}
              </Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, styles.statActive]}>
                {stats?.activeProjects ?? 0}
              </Text>
              <Text style={styles.statLabel}>Projects</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>My Tasks</Text>
          {myTasks.length === 0 && (
            <Text style={styles.emptyText}>No tasks assigned to you yet.</Text>
          )}
        </View>
      }
      ListEmptyComponent={null}
    />
  );
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

function priorityColor(priority: string): object {
  switch (priority) {
    case 'urgent': return { backgroundColor: '#fef2f2', borderColor: '#fecaca' };
    case 'high': return { backgroundColor: '#fff7ed', borderColor: '#fed7aa' };
    case 'medium': return { backgroundColor: '#fffbeb', borderColor: '#fde68a' };
    default: return { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' };
  }
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f9fafb' },
  listContent: { padding: 20, paddingTop: 56 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  greeting: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  greetingSub: { fontSize: 14, color: '#6b7280', marginTop: 2, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: { fontSize: 28, fontWeight: '700', color: '#0C66E4' },
  statOverdue: { color: '#dc2626' },
  statActive: { color: '#059669' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4, fontWeight: '500' },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center', paddingVertical: 24 },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskTitle: { fontSize: 15, fontWeight: '500', color: '#1a1a1a', flex: 1, marginRight: 8 },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  priorityText: { fontSize: 11, fontWeight: '600', color: '#374151', textTransform: 'capitalize' },
  taskMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  taskProject: { fontSize: 12, color: '#6b7280', flex: 1 },
  taskDue: { fontSize: 12, color: '#6b7280' },
});
