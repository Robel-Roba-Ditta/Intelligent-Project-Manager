import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { updateProject } from '@ipm/shared';
import type { ProjectDto } from '@ipm/shared';
import { api } from '../../lib/api';
import { extractErrorMessage } from '@ipm/shared';
import { useAuth } from '../../context/AuthContext';

interface Props {
  project: ProjectDto;
  onUpdate: () => void;
}

export default function DetailsTab({ project, onUpdate }: Props) {
  const { user } = useAuth();

  const currentMembership = project.members.find((m) => m.userId === user?.id);
  const isOwner = currentMembership?.role === 'owner' || user?.role === 'admin';
  const isAdmin = isOwner || currentMembership?.role === 'admin';

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  function handleNameChange(val: string) {
    setName(val);
    setDirty(val !== project.name || description !== (project.description ?? ''));
  }

  function handleDescChange(val: string) {
    setDescription(val);
    setDirty(name !== project.name || val !== (project.description ?? ''));
  }

  async function handleSave() {
    if (!dirty) return;
    setSaving(true);
    try {
      await updateProject(api, project.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setDirty(false);
      onUpdate();
    } catch (err) {
      Alert.alert('Error', extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Project details</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <View style={[styles.statusBadge, project.isActive ? styles.activeBadge : styles.inactiveBadge]}>
            <View style={[styles.dot, project.isActive ? styles.activeDot : styles.inactiveDot]} />
            <Text style={[styles.statusText, project.isActive ? styles.activeText : styles.inactiveText]}>
              {project.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Created by</Text>
          <Text style={styles.value}>{project.createdBy.fullName}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Members</Text>
          <Text style={styles.value}>{project.members.length}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Your role</Text>
          <Text style={[styles.value, { textTransform: 'capitalize' }]}>
            {currentMembership?.role ?? 'Not a member'}
          </Text>
        </View>
      </View>

      {isAdmin && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Edit project</Text>

          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={handleNameChange}
            placeholder="Project name"
            placeholderTextColor="#9ca3af"
          />

          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={handleDescChange}
            placeholder="Optional description"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.saveButton, (!dirty || saving) && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={!dirty || saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16 },
  card: {
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
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  label: { fontSize: 13, color: '#6b7280' },
  value: { fontSize: 13, color: '#1a1a1a', fontWeight: '500' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  activeBadge: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  inactiveBadge: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  activeDot: { backgroundColor: '#059669' },
  inactiveDot: { backgroundColor: '#9ca3af' },
  statusText: { fontSize: 12, fontWeight: '600' },
  activeText: { color: '#059669' },
  inactiveText: { color: '#6b7280' },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a1a1a',
    marginBottom: 12,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: '#0C66E4',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.5 },
  saveText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
});
