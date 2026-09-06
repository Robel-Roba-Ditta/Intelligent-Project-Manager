import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { getProject } from '@ipm/shared';
import type { ProjectDto } from '@ipm/shared';
import { api } from '../lib/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'ProjectDetail'>;

export default function ProjectDetailScreen({ route }: Props) {
  const { projectId } = route.params as { projectId: number; projectName: string };
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const p = await getProject(api, projectId);
        setProject(p);
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

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
    <View style={styles.container}>
      <Text style={styles.name}>{project.name}</Text>
      {project.description && (
        <Text style={styles.description}>{project.description}</Text>
      )}
      <View style={styles.metaRow}>
        <View style={[styles.statusBadge, project.isActive ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={[styles.statusText, project.isActive ? styles.activeText : styles.inactiveText]}>
            {project.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
        <Text style={styles.memberCount}>
          {project.members.length} member{project.members.length !== 1 ? 's' : ''}
        </Text>
      </View>
      <Text style={styles.placeholder}>
        Full project details coming in Phase 2.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 24,
    paddingTop: 56,
  },
  name: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  description: { fontSize: 15, color: '#6b7280', marginTop: 8, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  activeBadge: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  inactiveBadge: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' },
  statusText: { fontSize: 12, fontWeight: '600' },
  activeText: { color: '#059669' },
  inactiveText: { color: '#6b7280' },
  memberCount: { fontSize: 13, color: '#6b7280' },
  errorText: { fontSize: 16, color: '#dc2626' },
  placeholder: { fontSize: 14, color: '#9ca3af', marginTop: 32, textAlign: 'center', fontStyle: 'italic' },
});
