import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import {
  listSprints,
  createSprint,
  updateSprint,
  deleteSprint,
  startSprint,
  completeSprint,
  extractErrorMessage,
} from '@ipm/shared';
import type { SprintDto } from '@ipm/shared';
import { api } from '../../lib/api';

const STATUS_CONFIG: Record<string, { label: string; dotColor: string; bg: string; border: string; text: string }> = {
  PLANNED: { label: 'Planned', dotColor: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0', text: '#64748b' },
  ACTIVE: { label: 'Active', dotColor: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  COMPLETED: { label: 'Completed', dotColor: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', text: '#059669' },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface Props {
  projectId: number;
}

export default function SprintsTab({ projectId }: Props) {
  const [sprints, setSprints] = useState<SprintDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await listSprints(api, projectId);
      setSprints(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const hasActiveSprint = sprints.some((s) => s.status === 'ACTIVE');

  function openCreate() {
    setEditingId(null);
    setName('');
    setGoal('');
    setShowForm(true);
  }

  function openEdit(sprint: SprintDto) {
    setEditingId(sprint.id);
    setName(sprint.name);
    setGoal(sprint.goal ?? '');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    setError(null);
    setBusy(true);
    try {
      if (editingId) {
        await updateSprint(api, editingId, { name: name.trim(), goal: goal.trim() || undefined });
      } else {
        await createSprint(api, projectId, { name: name.trim(), goal: goal.trim() || undefined });
      }
      closeForm();
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleStart(id: number) {
    setError(null);
    setBusy(true);
    try {
      await startSprint(api, id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete(id: number) {
    setError(null);
    setBusy(true);
    try {
      await completeSprint(api, id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: number, sprintName: string) {
    Alert.alert('Delete sprint', `Delete "${sprintName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setError(null);
          setBusy(true);
          try {
            await deleteSprint(api, id);
            await load();
          } catch (err) {
            setError(extractErrorMessage(err));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#0C66E4" /></View>;
  }

  return (
    <View style={styles.flex}>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={sprints}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <Text style={styles.countText}>{sprints.length} {sprints.length === 1 ? 'sprint' : 'sprints'}</Text>
              <TouchableOpacity style={styles.newButton} onPress={openCreate}>
                <Text style={styles.newButtonText}>+ New Sprint</Text>
              </TouchableOpacity>
            </View>
            {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}
          </View>
        }
        renderItem={({ item: sprint }) => {
          const sc = STATUS_CONFIG[sprint.status] ?? STATUS_CONFIG.PLANNED;
          const isPlanned = sprint.status === 'PLANNED';
          const isActive = sprint.status === 'ACTIVE';
          const canStart = isPlanned && !hasActiveSprint;
          const cantStartReason = isPlanned && hasActiveSprint;

          return (
            <View style={styles.sprintCard}>
              <View style={styles.sprintHeader}>
                <View style={[styles.dot, { backgroundColor: sc.dotColor }]} />
                <Text style={styles.sprintName} numberOfLines={1}>{sprint.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                  <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
                </View>
              </View>

              {sprint.goal && <Text style={styles.sprintGoal} numberOfLines={2}>{sprint.goal}</Text>}

              <View style={styles.dateRow}>
                <Text style={styles.dateText}>Start: {formatDate(sprint.startDate)}</Text>
                <Text style={styles.dateText}>End: {formatDate(sprint.endDate)}</Text>
              </View>

              {cantStartReason && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>Complete the active sprint first</Text>
                </View>
              )}

              <View style={styles.sprintActions}>
                {canStart && (
                  <TouchableOpacity style={styles.startButton} onPress={() => handleStart(sprint.id)} disabled={busy}>
                    <Text style={styles.startText}>▶ Start</Text>
                  </TouchableOpacity>
                )}
                {isActive && (
                  <TouchableOpacity style={styles.completeButton} onPress={() => handleComplete(sprint.id)} disabled={busy}>
                    <Text style={styles.completeText}>✓ Complete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => openEdit(sprint)} disabled={busy}>
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(sprint.id, sprint.name)} disabled={busy}>
                  <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No sprints yet. Create one to get started.</Text>
          </View>
        }
      />

      <Modal visible={showForm} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>{editingId ? 'Edit Sprint' : 'New Sprint'}</Text>

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Sprint name" placeholderTextColor="#9ca3af" autoFocus />

            <Text style={styles.fieldLabel}>Goal (optional)</Text>
            <TextInput style={[styles.input, styles.textArea]} value={goal} onChangeText={setGoal} placeholder="What should this sprint achieve?" placeholderTextColor="#9ca3af" multiline numberOfLines={3} />

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeForm}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, busy && styles.buttonDisabled]} onPress={handleSubmit} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitText}>{editingId ? 'Save' : 'Create'}</Text>}
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
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  countText: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  newButton: { backgroundColor: '#0C66E4', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  newButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  errorBox: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 8, padding: 10, marginBottom: 12 },
  errorText: { color: '#dc2626', fontSize: 13 },
  sprintCard: { backgroundColor: '#ffffff', borderRadius: 10, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  sprintHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  sprintName: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1a1a1a' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '600' },
  sprintGoal: { fontSize: 13, color: '#6b7280', marginTop: 6 },
  dateRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  dateText: { fontSize: 12, color: '#9ca3af' },
  warningBox: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 6, padding: 8, marginTop: 8 },
  warningText: { fontSize: 12, color: '#b45309' },
  sprintActions: { flexDirection: 'row', gap: 14, marginTop: 10, alignItems: 'center' },
  startButton: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  startText: { fontSize: 13, color: '#1d4ed8', fontWeight: '600' },
  completeButton: { backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  completeText: { fontSize: 13, color: '#059669', fontWeight: '600' },
  actionText: { fontSize: 13, color: '#0C66E4', fontWeight: '500' },
  deleteText: { color: '#dc2626' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#9ca3af' },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheetCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  sheetTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6, marginTop: 4 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#1a1a1a', marginBottom: 12 },
  textArea: { height: 70, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 4 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  cancelBtnText: { fontSize: 15, color: '#6b7280', fontWeight: '500' },
  submitBtn: { backgroundColor: '#0C66E4', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  buttonDisabled: { opacity: 0.5 },
  submitText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
