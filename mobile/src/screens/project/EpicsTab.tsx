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
  listEpics,
  createEpic,
  updateEpic,
  deleteEpic,
  extractErrorMessage,
} from '@ipm/shared';
import type { EpicDto, EpicStatus } from '@ipm/shared';
import { api } from '../../lib/api';

const STATUS_CONFIG: Record<string, { label: string; dotColor: string; bg: string; border: string; text: string }> = {
  OPEN: { label: 'Open', dotColor: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  IN_PROGRESS: { label: 'In Progress', dotColor: '#f59e0b', bg: '#fffbeb', border: '#fde68a', text: '#b45309' },
  DONE: { label: 'Done', dotColor: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', text: '#059669' },
};

const STATUS_OPTIONS: EpicStatus[] = ['OPEN', 'IN_PROGRESS', 'DONE'];

interface Props {
  projectId: number;
}

export default function EpicsTab({ projectId }: Props) {
  const [epics, setEpics] = useState<EpicDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<EpicStatus>('OPEN');
  const [statusSheetVisible, setStatusSheetVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await listEpics(api, projectId);
      setEpics(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditingId(null);
    setName('');
    setDescription('');
    setStatus('OPEN');
    setShowForm(true);
  }

  function openEdit(epic: EpicDto) {
    setEditingId(epic.id);
    setName(epic.name);
    setDescription(epic.description ?? '');
    setStatus(epic.status);
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
        await updateEpic(api, editingId, { name: name.trim(), description: description.trim() || undefined, status });
      } else {
        await createEpic(api, projectId, { name: name.trim(), description: description.trim() || undefined, status });
      }
      closeForm();
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: number, epicName: string) {
    Alert.alert('Delete epic', `Delete "${epicName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setError(null);
          setBusy(true);
          try {
            await deleteEpic(api, id);
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
        data={epics}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <Text style={styles.countText}>{epics.length} {epics.length === 1 ? 'epic' : 'epics'}</Text>
              <TouchableOpacity style={styles.newButton} onPress={openCreate}>
                <Text style={styles.newButtonText}>+ New Epic</Text>
              </TouchableOpacity>
            </View>
            {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}
          </View>
        }
        renderItem={({ item: epic }) => {
          const sc = STATUS_CONFIG[epic.status] ?? STATUS_CONFIG.OPEN;
          return (
            <View style={styles.epicCard}>
              <View style={styles.epicHeader}>
                <View style={[styles.dot, { backgroundColor: sc.dotColor }]} />
                <Text style={styles.epicName} numberOfLines={1}>{epic.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                  <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
                </View>
              </View>
              {epic.description && <Text style={styles.epicDesc} numberOfLines={2}>{epic.description}</Text>}
              <View style={styles.epicActions}>
                <TouchableOpacity onPress={() => openEdit(epic)} disabled={busy}>
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(epic.id, epic.name)} disabled={busy}>
                  <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No epics yet. Create one to get started.</Text>
          </View>
        }
      />

      <Modal visible={showForm} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>{editingId ? 'Edit Epic' : 'New Epic'}</Text>

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Epic name" placeholderTextColor="#9ca3af" autoFocus />

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Optional description" placeholderTextColor="#9ca3af" multiline numberOfLines={3} />

            <Text style={styles.fieldLabel}>Status</Text>
            <TouchableOpacity style={styles.statusPicker} onPress={() => setStatusSheetVisible(true)}>
              <Text style={styles.statusPickerText}>{STATUS_CONFIG[status]?.label ?? status} ▾</Text>
            </TouchableOpacity>

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeForm}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, busy && styles.buttonDisabled]} onPress={handleSubmit} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitText}>{editingId ? 'Save' : 'Create'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={statusSheetVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setStatusSheetVisible(false)}>
          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>Select Status</Text>
            {STATUS_OPTIONS.map((s) => (
              <TouchableOpacity key={s} style={[styles.sheetOption, status === s && styles.sheetOptionActive]} onPress={() => { setStatus(s); setStatusSheetVisible(false); }}>
                <Text style={[styles.sheetOptionText, status === s && styles.sheetOptionTextActive]}>{STATUS_CONFIG[s].label}{status === s ? '  ✓' : ''}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
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
  epicCard: { backgroundColor: '#ffffff', borderRadius: 10, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  epicHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  epicName: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1a1a1a' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '600' },
  epicDesc: { fontSize: 13, color: '#6b7280', marginTop: 6 },
  epicActions: { flexDirection: 'row', gap: 16, marginTop: 10 },
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
  statusPicker: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16 },
  statusPickerText: { fontSize: 15, color: '#1a1a1a' },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  cancelText: { fontSize: 15, color: '#6b7280', fontWeight: '500' },
  submitBtn: { backgroundColor: '#0C66E4', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  buttonDisabled: { opacity: 0.5 },
  submitText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  sheetOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  sheetOptionActive: { backgroundColor: '#eff6ff' },
  sheetOptionText: { fontSize: 16, color: '#1a1a1a' },
  sheetOptionTextActive: { color: '#0C66E4', fontWeight: '600' },
});
