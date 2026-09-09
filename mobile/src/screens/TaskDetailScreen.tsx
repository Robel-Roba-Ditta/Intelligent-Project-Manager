import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
  FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  getTask,
  updateTask,
  changeTaskStatus,
  listComments,
  createComment,
  deleteComment,
  listAttachments,
  createAttachment,
  deleteAttachment,
  listLabels,
  attachLabel,
  detachLabel,
  createLabel,
  listProjectMembers,
  listSprints,
  getWatchStatus,
  watchTask,
  unwatchTask,
  extractErrorMessage,
} from '@ipm/shared';
import type {
  TaskDto,
  TaskStatus,
  TaskPriority,
  CommentDto,
  AttachmentDto,
  LabelDto,
  ProjectMemberDto,
  SprintDto,
} from '@ipm/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

const STATUS_CONFIG: Record<TaskStatus, { label: string; dotColor: string; bg: string; border: string; text: string }> = {
  TODO: { label: 'To Do', dotColor: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0', text: '#64748b' },
  IN_PROGRESS: { label: 'In Progress', dotColor: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  IN_REVIEW: { label: 'In Review', dotColor: '#a855f7', bg: '#faf5ff', border: '#e9d5ff', text: '#7c3aed' },
  DONE: { label: 'Done', dotColor: '#10b981', bg: '#f0fdf4', border: '#bbf7d0', text: '#059669' },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; bg: string; border: string; text: string }> = {
  LOW: { label: 'Low', bg: '#f8fafc', border: '#e2e8f0', text: '#64748b' },
  MEDIUM: { label: 'Medium', bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  HIGH: { label: 'High', bg: '#fffbeb', border: '#fde68a', text: '#b45309' },
  URGENT: { label: 'Urgent', bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
};

const TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ['IN_PROGRESS'],
  IN_PROGRESS: ['IN_REVIEW', 'TODO'],
  IN_REVIEW: ['DONE', 'IN_PROGRESS'],
  DONE: ['IN_REVIEW'],
};

type Props = NativeStackScreenProps<any, 'TaskDetail'>;

export default function TaskDetailScreen({ route }: Props) {
  const { taskId, projectId } = route.params as { taskId: number; projectId: number };
  const { user } = useAuth();

  const [task, setTask] = useState<TaskDto | null>(null);
  const [members, setMembers] = useState<ProjectMemberDto[]>([]);
  const [sprints, setSprints] = useState<SprintDto[]>([]);
  const [projectLabels, setProjectLabels] = useState<LabelDto[]>([]);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [attachments, setAttachments] = useState<AttachmentDto[]>([]);
  const [watching, setWatching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Inline edit state
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [titleDirty, setTitleDirty] = useState(false);
  const [descDirty, setDescDirty] = useState(false);

  // Sheets
  const [moveSheetVisible, setMoveSheetVisible] = useState(false);
  const [pickerSheet, setPickerSheet] = useState<{ field: string; options: { label: string; value: string }[] } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [labelSheetVisible, setLabelSheetVisible] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#0C66E4');

  // Comments
  const [commentText, setCommentText] = useState('');

  // Attachments
  const [attName, setAttName] = useState('');
  const [attUrl, setAttUrl] = useState('');

  const loadAll = useCallback(async () => {
    try {
      const [t, m, s, l, c, a, w] = await Promise.all([
        getTask(api, taskId),
        listProjectMembers(api, projectId),
        listSprints(api, projectId),
        listLabels(api, projectId),
        listComments(api, taskId),
        listAttachments(api, taskId),
        getWatchStatus(api, taskId),
      ]);
      setTask(t);
      setEditTitle(t.title);
      setEditDesc(t.description ?? '');
      setMembers(m);
      setSprints(s);
      setProjectLabels(l);
      setComments(c);
      setAttachments(a);
      setWatching(w.watching);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [taskId, projectId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // --- Field savers (independent, no page-wide save) ---

  async function saveTitle() {
    if (!titleDirty || !task || editTitle.trim() === task.title) { setTitleDirty(false); return; }
    try {
      await updateTask(api, task.id, { title: editTitle.trim() });
      setTask(prev => prev ? { ...prev, title: editTitle.trim() } : prev);
      setTitleDirty(false);
    } catch (err) { Alert.alert('Error', extractErrorMessage(err)); }
  }

  async function saveDesc() {
    if (!descDirty || !task) { setDescDirty(false); return; }
    try {
      await updateTask(api, task.id, { description: editDesc.trim() || undefined });
      setTask(prev => prev ? { ...prev, description: editDesc.trim() || null } : prev);
      setDescDirty(false);
    } catch (err) { Alert.alert('Error', extractErrorMessage(err)); }
  }

  async function handleStatusMove(newStatus: TaskStatus) {
    if (!task) return;
    setMoveSheetVisible(false);
    setBusy(true);
    try {
      const updated = await changeTaskStatus(api, task.id, newStatus);
      setTask(updated);
    } catch (err) { Alert.alert('Error', extractErrorMessage(err)); }
    finally { setBusy(false); }
  }

  async function handleFieldChange(field: string, value: string) {
    if (!task) return;
    setPickerSheet(null);
    setBusy(true);
    try {
      if (field === 'priority') {
        const updated = await updateTask(api, task.id, { priority: value as TaskPriority });
        setTask(updated);
      } else if (field === 'assignee') {
        const updated = await updateTask(api, task.id, { assigneeId: value ? Number(value) : null });
        setTask(updated);
      } else if (field === 'sprint') {
        const updated = await updateTask(api, task.id, { sprintId: value ? Number(value) : null });
        setTask(updated);
      }
    } catch (err) { Alert.alert('Error', extractErrorMessage(err)); }
    finally { setBusy(false); }
  }

  async function handleDueDateChange(_event: any, date?: Date) {
    setShowDatePicker(Platform.OS === 'ios');
    if (!task || !date) return;
    setBusy(true);
    try {
      const updated = await updateTask(api, task.id, { dueDate: date.toISOString().split('T')[0] });
      setTask(updated);
    } catch (err) { Alert.alert('Error', extractErrorMessage(err)); }
    finally { setBusy(false); }
  }

  // --- Watch ---
  async function toggleWatch() {
    setBusy(true);
    try {
      if (watching) {
        await unwatchTask(api, taskId);
        setWatching(false);
      } else {
        await watchTask(api, taskId);
        setWatching(true);
      }
    } catch (err) { Alert.alert('Error', extractErrorMessage(err)); }
    finally { setBusy(false); }
  }

  // --- Labels ---
  async function handleToggleLabel(labelId: number, isAttached: boolean) {
    if (!task) return;
    try {
      if (isAttached) { await detachLabel(api, task.id, labelId); }
      else { await attachLabel(api, task.id, labelId); }
      const updated = await getTask(api, task.id);
      setTask(updated);
    } catch (err) { Alert.alert('Error', extractErrorMessage(err)); }
  }

  async function handleCreateLabel() {
    if (!newLabelName.trim()) return;
    try {
      await createLabel(api, projectId, { name: newLabelName.trim(), color: newLabelColor });
      setNewLabelName('');
      setNewLabelColor('#0C66E4');
      const labels = await listLabels(api, projectId);
      setProjectLabels(labels);
    } catch (err) { Alert.alert('Error', extractErrorMessage(err)); }
  }

  // --- Comments ---
  async function handlePostComment() {
    if (!commentText.trim()) return;
    setBusy(true);
    try {
      await createComment(api, taskId, commentText.trim());
      setCommentText('');
      const updated = await listComments(api, taskId);
      setComments(updated);
    } catch (err) { Alert.alert('Error', extractErrorMessage(err)); }
    finally { setBusy(false); }
  }

  async function handleDeleteComment(id: number) {
    Alert.alert('Delete comment', 'Delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteComment(api, id);
          setComments(prev => prev.filter(c => c.id !== id));
        } catch (err) { Alert.alert('Error', extractErrorMessage(err)); }
      }},
    ]);
  }

  // --- Attachments ---
  async function handleAddAttachment() {
    if (!attName.trim() || !attUrl.trim()) return;
    setBusy(true);
    try {
      await createAttachment(api, taskId, { fileName: attName.trim(), fileUrl: attUrl.trim() });
      setAttName('');
      setAttUrl('');
      const updated = await listAttachments(api, taskId);
      setAttachments(updated);
    } catch (err) { Alert.alert('Error', extractErrorMessage(err)); }
    finally { setBusy(false); }
  }

  async function handleDeleteAttachment(id: number) {
    Alert.alert('Delete attachment', 'Remove this attachment?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteAttachment(api, id);
          setAttachments(prev => prev.filter(a => a.id !== id));
        } catch (err) { Alert.alert('Error', extractErrorMessage(err)); }
      }},
    ]);
  }

  // --- Helpers ---
  function getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
  function avatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#0ea5e9', '#14b8a6', '#059669'];
    return colors[Math.abs(hash) % colors.length];
  }

  if (loading) {
    return <View style={s.centered}><ActivityIndicator size="large" color="#0C66E4" /></View>;
  }
  if (!task) {
    return <View style={s.centered}><Text style={s.errorText}>Task not found</Text></View>;
  }

  const sc = STATUS_CONFIG[task.status];
  const pc = PRIORITY_CONFIG[task.priority];
  const attachedIds = new Set(task.labels.map(l => l.id));

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Title */}
        <TextInput
          style={s.titleInput}
          value={editTitle}
          onChangeText={v => { setEditTitle(v); setTitleDirty(true); }}
          onBlur={saveTitle}
          onSubmitEditing={saveTitle}
          returnKeyType="done"
          placeholder="Task title"
          placeholderTextColor="#9ca3af"
        />

        {/* Description */}
        <TextInput
          style={s.descInput}
          value={editDesc}
          onChangeText={v => { setEditDesc(v); setDescDirty(true); }}
          onBlur={saveDesc}
          placeholder="Add a description..."
          placeholderTextColor="#9ca3af"
          multiline
        />

        {/* Watch toggle */}
        <TouchableOpacity style={[s.watchButton, watching && s.watchingButton]} onPress={toggleWatch} disabled={busy}>
          <Text style={[s.watchText, watching && s.watchingText]}>
            {watching ? '👁 Watching' : '👁 Watch'}
          </Text>
        </TouchableOpacity>

        {/* Fields */}
        <View style={s.fieldsCard}>
          <Text style={s.sectionTitle}>Details</Text>

          {/* Status */}
          <TouchableOpacity style={s.fieldRow} onPress={() => setMoveSheetVisible(true)} disabled={busy}>
            <Text style={s.fieldLabel}>Status</Text>
            <View style={[s.fieldBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
              <View style={[s.dot, { backgroundColor: sc.dotColor }]} />
              <Text style={[s.fieldBadgeText, { color: sc.text }]}>{sc.label} ▾</Text>
            </View>
          </TouchableOpacity>

          {/* Priority */}
          <TouchableOpacity style={s.fieldRow} onPress={() => setPickerSheet({
            field: 'priority',
            options: (['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TaskPriority[]).map(p => ({ label: PRIORITY_CONFIG[p].label, value: p })),
          })} disabled={busy}>
            <Text style={s.fieldLabel}>Priority</Text>
            <View style={[s.fieldBadge, { backgroundColor: pc.bg, borderColor: pc.border }]}>
              <Text style={[s.fieldBadgeText, { color: pc.text }]}>{pc.label} ▾</Text>
            </View>
          </TouchableOpacity>

          {/* Assignee */}
          <TouchableOpacity style={s.fieldRow} onPress={() => setPickerSheet({
            field: 'assignee',
            options: [{ label: 'Unassigned', value: '' }, ...members.map(m => ({ label: m.user.fullName, value: String(m.userId) }))],
          })} disabled={busy}>
            <Text style={s.fieldLabel}>Assignee</Text>
            <Text style={s.fieldValue}>{task.assignee?.fullName ?? 'Unassigned'} ▾</Text>
          </TouchableOpacity>

          {/* Sprint */}
          <TouchableOpacity style={s.fieldRow} onPress={() => setPickerSheet({
            field: 'sprint',
            options: [{ label: 'None', value: '' }, ...sprints.map(sp => ({ label: sp.name, value: String(sp.id) }))],
          })} disabled={busy}>
            <Text style={s.fieldLabel}>Sprint</Text>
            <Text style={s.fieldValue}>{task.sprint?.name ?? 'None'} ▾</Text>
          </TouchableOpacity>

          {/* Due Date */}
          <TouchableOpacity style={s.fieldRow} onPress={() => setShowDatePicker(true)} disabled={busy}>
            <Text style={s.fieldLabel}>Due Date</Text>
            <Text style={s.fieldValue}>
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'None'} ▾
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={task.dueDate ? new Date(task.dueDate) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDueDateChange}
            />
          )}
        </View>

        {/* Labels */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Labels</Text>
            <TouchableOpacity onPress={() => setLabelSheetVisible(true)}>
              <Text style={s.addAction}>+ Add</Text>
            </TouchableOpacity>
          </View>
          <View style={s.labelChips}>
            {task.labels.length === 0 && <Text style={s.muted}>No labels</Text>}
            {task.labels.map(label => (
              <View key={label.id} style={[s.labelChip, { backgroundColor: `${label.color}18`, borderColor: `${label.color}40` }]}>
                <View style={[s.labelDot, { backgroundColor: label.color }]} />
                <Text style={[s.labelChipText, { color: label.color }]}>{label.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Comments */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>Comments ({comments.length})</Text>
          {comments.length === 0 && <Text style={s.muted}>No comments yet</Text>}
          {comments.map(c => (
            <View key={c.id} style={s.commentRow}>
              <View style={[s.commentAvatar, { backgroundColor: avatarColor(c.author.fullName) }]}>
                <Text style={s.commentAvatarText}>{getInitials(c.author.fullName)}</Text>
              </View>
              <View style={s.commentBody}>
                <View style={s.commentHeader}>
                  <Text style={s.commentAuthor}>{c.author.fullName}</Text>
                  <Text style={s.commentDate}>{new Date(c.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={s.commentText}>{c.body}</Text>
              </View>
              {c.authorId === user?.id && (
                <TouchableOpacity onPress={() => handleDeleteComment(c.id)} style={s.deleteBtn}>
                  <Text style={s.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Attachments */}
        <View style={s.sectionCard}>
          <Text style={s.sectionTitle}>Attachments ({attachments.length})</Text>
          {attachments.length === 0 && <Text style={s.muted}>No attachments</Text>}
          {attachments.map(a => (
            <View key={a.id} style={s.attachmentRow}>
              <TouchableOpacity style={s.attachmentLink} onPress={() => Linking.openURL(a.fileUrl)}>
                <Text style={s.attachmentIcon}>📎</Text>
                <Text style={s.attachmentName} numberOfLines={1}>{a.fileName}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteAttachment(a.id)} style={s.deleteBtn}>
                <Text style={s.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={s.attachForm}>
            <TextInput style={s.attachInput} value={attName} onChangeText={setAttName} placeholder="File name" placeholderTextColor="#9ca3af" />
            <TextInput style={s.attachInput} value={attUrl} onChangeText={setAttUrl} placeholder="File URL" placeholderTextColor="#9ca3af" autoCapitalize="none" />
            <TouchableOpacity style={[s.attachBtn, (!attName.trim() || !attUrl.trim() || busy) && s.btnDisabled]} onPress={handleAddAttachment} disabled={!attName.trim() || !attUrl.trim() || busy}>
              <Text style={s.attachBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Comment composer pinned to bottom */}
      <View style={s.composerBar}>
        <TextInput
          style={s.composerInput}
          value={commentText}
          onChangeText={setCommentText}
          placeholder="Write a comment..."
          placeholderTextColor="#9ca3af"
          multiline
        />
        <TouchableOpacity style={[s.sendBtn, (!commentText.trim() || busy) && s.btnDisabled]} onPress={handlePostComment} disabled={!commentText.trim() || busy}>
          {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.sendBtnText}>Send</Text>}
        </TouchableOpacity>
      </View>

      {/* STATUS MOVE SHEET — same logic as Phase 3 board */}
      <Modal visible={moveSheetVisible} transparent animationType="slide">
        <TouchableOpacity style={s.sheetOverlay} activeOpacity={1} onPress={() => setMoveSheetVisible(false)}>
          <View style={s.sheetCard}>
            <Text style={s.sheetTitle}>Change Status</Text>
            <Text style={s.moveCurrentLabel}>Current: {sc.label}</Text>
            {(TRANSITIONS[task.status] ?? []).map(status => {
              const cfg = STATUS_CONFIG[status];
              return (
                <TouchableOpacity
                  key={status}
                  style={[s.moveOption, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
                  onPress={() => handleStatusMove(status)}
                >
                  <View style={[s.dot, { backgroundColor: cfg.dotColor }]} />
                  <Text style={[s.moveOptionText, { color: cfg.text }]}>Move to {cfg.label}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={s.sheetCancel} onPress={() => setMoveSheetVisible(false)}>
              <Text style={s.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* GENERIC PICKER SHEET */}
      <Modal visible={!!pickerSheet} transparent animationType="fade">
        <TouchableOpacity style={s.sheetOverlay} activeOpacity={1} onPress={() => setPickerSheet(null)}>
          <View style={s.sheetCard}>
            <Text style={s.sheetTitle}>Select</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {pickerSheet?.options.map(opt => (
                <TouchableOpacity key={opt.value} style={s.sheetOption} onPress={() => handleFieldChange(pickerSheet.field, opt.value)}>
                  <Text style={s.sheetOptionText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* LABEL SHEET */}
      <Modal visible={labelSheetVisible} transparent animationType="slide">
        <TouchableOpacity style={s.sheetOverlay} activeOpacity={1} onPress={() => setLabelSheetVisible(false)}>
          <View style={s.sheetCard}>
            <Text style={s.sheetTitle}>Manage Labels</Text>
            <ScrollView style={{ maxHeight: 280 }}>
              {projectLabels.map(label => {
                const attached = attachedIds.has(label.id);
                return (
                  <TouchableOpacity key={label.id} style={s.labelOption} onPress={() => handleToggleLabel(label.id, attached)}>
                    <View style={[s.labelDot, { backgroundColor: label.color }]} />
                    <Text style={s.labelOptionText}>{label.name}</Text>
                    {attached && <Text style={s.checkMark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={s.newLabelRow}>
              <TextInput style={s.newLabelInput} value={newLabelName} onChangeText={setNewLabelName} placeholder="New label name" placeholderTextColor="#9ca3af" />
              <TouchableOpacity style={s.colorSwatch} onPress={() => {
                const colors = ['#0C66E4', '#dc2626', '#059669', '#f59e0b', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6'];
                const idx = colors.indexOf(newLabelColor);
                setNewLabelColor(colors[(idx + 1) % colors.length]);
              }}>
                <View style={[s.swatchInner, { backgroundColor: newLabelColor }]} />
              </TouchableOpacity>
              <TouchableOpacity style={[s.newLabelBtn, !newLabelName.trim() && s.btnDisabled]} onPress={handleCreateLabel} disabled={!newLabelName.trim()}>
                <Text style={s.newLabelBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.sheetCancel} onPress={() => setLabelSheetVisible(false)}>
              <Text style={s.sheetCancelText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  errorText: { fontSize: 16, color: '#dc2626' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  titleInput: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 8, marginBottom: 8 },
  descInput: { fontSize: 15, color: '#374151', minHeight: 44, marginBottom: 12 },
  watchButton: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', marginBottom: 12 },
  watchingButton: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  watchText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  watchingText: { color: '#1d4ed8' },
  fieldsCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 10 },
  addAction: { fontSize: 13, color: '#0C66E4', fontWeight: '600' },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  fieldLabel: { fontSize: 13, color: '#6b7280' },
  fieldValue: { fontSize: 13, color: '#1a1a1a', fontWeight: '500' },
  fieldBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  fieldBadgeText: { fontSize: 12, fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  labelChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  labelChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  labelDot: { width: 8, height: 8, borderRadius: 4 },
  labelChipText: { fontSize: 12, fontWeight: '600' },
  muted: { fontSize: 13, color: '#9ca3af' },
  commentRow: { flexDirection: 'row', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  commentAvatarText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  commentBody: { flex: 1 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  commentAuthor: { fontSize: 13, fontWeight: '600', color: '#1a1a1a' },
  commentDate: { fontSize: 11, color: '#9ca3af' },
  commentText: { fontSize: 14, color: '#374151' },
  deleteBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  deleteBtnText: { color: '#dc2626', fontSize: 13, fontWeight: '600' },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  attachmentLink: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  attachmentIcon: { fontSize: 16 },
  attachmentName: { fontSize: 14, color: '#0C66E4', fontWeight: '500' },
  attachForm: { marginTop: 10, gap: 6 },
  attachInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: '#1a1a1a' },
  attachBtn: { backgroundColor: '#0C66E4', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  attachBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  composerBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  composerInput: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, maxHeight: 80, color: '#1a1a1a' },
  sendBtn: { backgroundColor: '#0C66E4', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 9 },
  sendBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  btnDisabled: { opacity: 0.5 },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheetCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  sheetTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 16 },
  sheetOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  sheetOptionText: { fontSize: 16, color: '#1a1a1a' },
  moveCurrentLabel: { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  moveOption: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  moveOptionText: { fontSize: 15, fontWeight: '500' },
  sheetCancel: { marginTop: 8, paddingVertical: 14, alignItems: 'center' },
  sheetCancelText: { fontSize: 16, color: '#6b7280', fontWeight: '500' },
  labelOption: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  labelOptionText: { flex: 1, fontSize: 15, color: '#1a1a1a' },
  checkMark: { fontSize: 16, color: '#0C66E4', fontWeight: '600' },
  newLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  newLabelInput: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: '#1a1a1a' },
  colorSwatch: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', justifyContent: 'center', alignItems: 'center' },
  swatchInner: { width: 24, height: 24, borderRadius: 6 },
  newLabelBtn: { backgroundColor: '#0C66E4', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  newLabelBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
