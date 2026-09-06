import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { listProjects, createProject } from '@ipm/shared';
import type { ProjectDto } from '@ipm/shared';
import { api } from '../lib/api';
import { extractErrorMessage } from '@ipm/shared';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

export default function ProjectsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const result = await listProjects(api);
      setProjects(result);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProjects();
  }, [fetchProjects]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createProject(api, {
        name: newName.trim(),
        description: newDesc.trim() || undefined,
      });
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
      fetchProjects();
    } catch (err) {
      Alert.alert('Error', extractErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0C66E4" />
      </View>
    );
  }

  const renderProject = ({ item }: { item: ProjectDto }) => (
    <TouchableOpacity
      style={styles.projectCard}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id, projectName: item.name })}
    >
      <View style={styles.projectHeader}>
        <Text style={styles.projectName} numberOfLines={1}>{item.name}</Text>
        <View style={[styles.statusBadge, item.isActive ? styles.activeBadge : styles.inactiveBadge]}>
          <Text style={[styles.statusText, item.isActive ? styles.activeText : styles.inactiveText]}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      {item.description && (
        <Text style={styles.projectDesc} numberOfLines={2}>{item.description}</Text>
      )}
      <Text style={styles.memberCount}>
        {item.members.length} member{item.members.length !== 1 ? 's' : ''}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.flex}>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={projects}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderProject}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0C66E4" />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Projects</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowCreate(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>+ New</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No projects yet.</Text>
            <Text style={styles.emptySubtext}>Tap "+ New" to create your first project.</Text>
          </View>
        }
      />

      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create Project</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Project name"
              placeholderTextColor="#9ca3af"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />

            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Brief description..."
              placeholderTextColor="#9ca3af"
              value={newDesc}
              onChangeText={setNewDesc}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => { setShowCreate(false); setNewName(''); setNewDesc(''); }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, creating && styles.buttonDisabled]}
                onPress={handleCreate}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.createText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { flex: 1, backgroundColor: '#f9fafb' },
  listContent: { padding: 20, paddingTop: 56 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  addButton: {
    backgroundColor: '#0C66E4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  projectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  projectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  projectName: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  activeBadge: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  inactiveBadge: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' },
  statusText: { fontSize: 11, fontWeight: '600' },
  activeText: { color: '#059669' },
  inactiveText: { color: '#6b7280' },
  projectDesc: { fontSize: 13, color: '#6b7280', marginTop: 6 },
  memberCount: { fontSize: 12, color: '#9ca3af', marginTop: 8 },
  emptyContainer: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 16, color: '#6b7280', fontWeight: '500' },
  emptySubtext: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4 },
  cancelButton: { paddingVertical: 10, paddingHorizontal: 20 },
  cancelText: { fontSize: 15, color: '#6b7280', fontWeight: '500' },
  createButton: {
    backgroundColor: '#0C66E4',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  createText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
