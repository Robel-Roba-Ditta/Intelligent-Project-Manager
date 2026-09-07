import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { getProject } from '@ipm/shared';
import type { ProjectDto } from '@ipm/shared';
import { api } from '../lib/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import DetailsTab from './project/DetailsTab';
import MembersTab from './project/MembersTab';
import EpicsTab from './project/EpicsTab';
import SprintsTab from './project/SprintsTab';
import TasksTab from './project/TasksTab';

const TopTab = createMaterialTopTabNavigator();

type Props = NativeStackScreenProps<any, 'ProjectDetail'>;

export default function ProjectDetailScreen({ route }: Props) {
  const { projectId } = route.params as { projectId: number };
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProject = useCallback(async () => {
    try {
      const p = await getProject(api, projectId);
      setProject(p);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0C66E4" />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Project not found</Text>
      </View>
    );
  }

  return (
    <TopTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#0C66E4',
        tabBarInactiveTintColor: '#6b7280',
        tabBarIndicatorStyle: { backgroundColor: '#0C66E4' },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', textTransform: 'none' },
        tabBarStyle: { backgroundColor: '#ffffff', elevation: 0, shadowOpacity: 0 },
        tabBarScrollEnabled: true,
        tabBarItemStyle: { width: 'auto', paddingHorizontal: 12 },
        lazy: true,
      }}
    >
      <TopTab.Screen name="Details">
        {() => <DetailsTab project={project} onUpdate={loadProject} />}
      </TopTab.Screen>
      <TopTab.Screen name="Members" options={{ tabBarBadge: () => <Text style={styles.badge}>{project.members.length}</Text> }}>
        {() => <MembersTab project={project} onUpdate={loadProject} />}
      </TopTab.Screen>
      <TopTab.Screen name="Epics">
        {() => <EpicsTab projectId={project.id} />}
      </TopTab.Screen>
      <TopTab.Screen name="Sprints">
        {() => <SprintsTab projectId={project.id} />}
      </TopTab.Screen>
      <TopTab.Screen name="Tasks" component={TasksTab} />
    </TopTab.Navigator>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  errorText: { fontSize: 16, color: '#dc2626' },
  badge: { fontSize: 10, color: '#6b7280', backgroundColor: '#f3f4f6', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8, overflow: 'hidden' },
});
