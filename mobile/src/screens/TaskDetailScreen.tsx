import React, { useEffect, useState, useCallback } from 'react';
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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
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
  listTasks,
  getWatchStatus,
  watchTask,
  unwatchTask,
  listTimeLogs,
  createTimeLog,
  deleteTimeLog,
  listDependencies,
  createDependency,
  deleteDependency,
  listActivity,
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
  TimeLogDto,
  TimeLogsResponse,
  DependenciesResponse,
  ActivityLogDto,
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

function formatActivityLine(entry: ActivityLogDto): string {
  const d = entry.details;
  switch (entry.action) {
    case 'status_changed':
      return `changed status from ${STATUS_CONFIG[d.fromStatus as TaskStatus]?.label || d.fromStatus} to ${STATUS_CONFIG[d.toStatus as TaskStatus]?.label || d.toStatus}`;
    case 'assignee_changed':
      return d.toAssigneeId ? 'assigned this task' : 'unassigned this task';
    case 'comment_posted':
      return 'commented';
    case 'attachment_added':
      return `added attachment "${d.fileName}"`;
    case 'watcher_toggled':
      return d.watching ? 'started watching' : 'stopped watching';
    case 'dependency_added':
      return `linked as blocking Task #${d.blockedTaskId}`;
    case 'time_logged':
      return `logged ${d.hours}h`;
    default:
      return entry.action;
  }
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

type Props = NativeStackScreenProps<any, 'TaskDetail'>;

export default function TaskDetailScreen({ route }: Props) {
  const { taskId, projectId } = route.params as { taskId: number; projectId: number };
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [task, setTask] = useState<TaskDto | null>(null);
  const [members, setMembers] = useState<ProjectMemberDto[]>([]);
  const [sprints, setSprints] = useState<SprintDto[]>([]);
  const [projectLabels, setProjectLabels] = useState<LabelDto[]>([]);
  const [projectTasks, setProjectTasks] = useState<TaskDto[]>([]);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [attachments, setAttachments] = useState<AttachmentDto[]>([]);
  const [watching, setWatching] = useState(false);
  const [timeLogs, setTimeLogs] = useState<TimeLogDto[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [deps, setDeps] = useState<DependenciesResponse>({ blocks: [], blockedBy: [] });
  const [activity, setActivity] = useState<ActivityLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [titleDirty, setTitleDirty] = useState(false);
  const [descDirty, setDescDirty] = useState(false);

  const [moveSheetVisible, setMoveSheetVisible] = useState(false);
  const [pickerSheet, setPickerSheet] = useState<{ field: string; options: { label: string; value: string }[] } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [labelSheetVisible, setLabelSheetVisible] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#0C66E4');

  const [commentText, setCommentText] = useState('');
  const [attName, setAttName] = useState('');
  const [attUrl, setAttUrl] = useState('');

  const [logHours, setLogHours] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [showLogDatePicker, setShowLogDatePicker] = useState(false);

  const [depPickerVisible, setDepPickerVisible] = useState(false);
  const [depDirection, setDepDirection] = useState<'blocks' | 'blockedBy'>('blocks');

  const loadAll = useCallback(async () => {
    try {
      const [t, m, sp, l, pt, c, a, w, tl, d, act] = await Promise.all([
        getTask(api, taskId),
        listProjectMembers(api, projectId),
        listSprints(api, projectId),
        listLabels(api, projectId),
        listTasks(api, projectId),
        listComments(api, taskId),
        listAttachments(api, taskId),
        getWatchStatus(api, taskId),
        listTimeLogs(api, taskId),
        listDependencies(api, taskId),
        listActivity(api, taskId),
      ]);
      setTask(t);
      setEditTitle(t.title);
      setEditDesc(t.description ?? '');
      setMembers(m);
      setSprints(sp);
      setProjectLabels(l);
      setProjectTasks(pt);
      setComments(c);
      setAttachments(a);
      setWatching(w.watching);
      setTimeLogs(tl.entries);
      setTotalHours(tl.totalHours);
      setDeps(d);
      setActivity(act);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [taskId, projectId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function saveTitle() {
    if (!titleDirty || !task || editTitle.trim() === task.title) { setTitleDirty(false); return; }
    try { await updateTask(api, task.id, { title: editTitle.trim() }); setTask(prev => prev ? { ...prev, title: editTitle.trim() } : prev); setTitleDirty(false); }
    catch (err) { Alert.alert('Error', extractErrorMessage(err)); }
  }

  async function saveDesc() {
    if (!descDirty || !task) { setDescDirty(false); return; }
    try { await updateTask(api, task.id, { description: editDesc.trim() || undefined }); setTask(prev => prev ? { ...prev, description: editDesc.trim() || null } : prev); setDescDirty(false); }
    catch (err) { Alert.alert('Error', extractErrorMessage(err)); }
  }

  async function handleStatusMove(newStatus: TaskStatus) {
    if (!task) return;
    setMoveSheetVisible(false);
    setBusy(true);
    try { const updated = await changeTaskStatus(api, task.id, newStatus); setTask(updated); const act = await listActivity(api, taskId); setActivity(act); }
    catch (err) { Alert.alert('Error', extractErrorMessage(err)); }
    finally { setBusy(false); }
  }

  async function handleFieldChange(field: string, value: string) {
    if (!task) return;
    setPickerSheet(null);
    setBusy(true);
    try {
      let updated: TaskDto;
      if (field === 'priority') updated = await updateTask(api, task.id, { priority: value as TaskPriority });
      else if (field === 'assignee') updated = await updateTask(api, task.id, { assigneeId: value ? Number(value) : null });
      else if (field === 'sprint') updated = await updateTask(api, task.id, { sprintId: value ? Number(value) : null });
      else return;
      setTask(updated);
      const act = await listActivity(api, taskId);
      setActivity(act);
    } catch (err) { Alert.alert('Error', extractErrorMessage(err)); }
    finally { setBusy(false); }
  }

  async function handleDueDateChange(_event: any, date?: Date) {
    setShowDatePicker(Platform.OS === 'ios');
    if (!task || !date) return;
    setBusy(true);
    try { const updated = await updateTask(api, task.id, { dueDate: date.toISOString().split('T')[0] }); setTask(updated); }
    catch (err) { Alert.alert('Error', extractErrorMessage(err)); }
    finally { setBusy(false); }
  }

  async function toggleWatch() {
    setBusy(true);
    try { if (watching) { await unwatchTask(api, taskId); setWatching(false); } else { await watchTask(api, taskId); setWatching(true); } }
    catch (err) { Alert.alert('Error', extractErrorMessage(err)); }
    finally { setBusy(false); }
  }

  async function handleToggleLabel(labelId: number, isAttached: boolean) {
    if (!task) return;
    try {
      if (isAttached) await detachLabel(api, task.id, labelId);
      else await attachLabel(api, task.id, labelId);
      const updated = await getTask(api, task.id);
      setTask(updated);
    } catch (err) { Alert.alert('Error', extractErrorMessage(err)); }
  }

  async function handleCreateLabel() {
    if (!newLabelName.trim()) return;
    try { await createLabel(api, projectId, { name: newLabelName.trim(), color: newLabelColor }); setNewLabelName(''); setNewLabelColor('#0C66E4'); setProjectLabels(await listLabels(api, projectId)); }
    catch (err) { Alert.alert('Error', extractErrorMessage(err)); }
  }

  async function handlePostComment() {
    if (!commentText.trim()) return;
    setBusy(true);
    try { await createComment(api, taskId, commentText.trim()); setCommentText(''); setComments(await listComments(api, taskId)); setActivity(await listActivity(api, taskId)); }
    catch (err) { Alert.alert('Error', extractErrorMessage(err)); }
    finally { setBusy(false); }
  }

  async function handleDeleteComment(id: number) {
    Alert.alert('Delete comment', 'Delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await deleteComment(api, id); setComments(prev => prev.filter(c => c.id !== id)); } catch (err) { Alert.alert('Error', extractErrorMessage(err)); } } },
    ]);
  }

  async function handleAddAttachment() {
    if (!attName.trim() || !attUrl.trim()) return;
    setBusy(true);
    try { await createAttachment(api, taskId, { fileName: attName.trim(), fileUrl: attUrl.trim() }); setAttName(''); setAttUrl(''); setAttachments(await listAttachments(api, taskId)); }
    catch (err) { Alert.alert('Error', extractErrorMessage(err)); }
    finally { setBusy(false); }
  }

  async function handleDeleteAttachment(id: number) {
    Alert.alert('Delete attachment', 'Remove this attachment?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await deleteAttachment(api, id); setAttachments(prev => prev.filter(a => a.id !== id)); } catch (err) { Alert.alert('Error', extractErrorMessage(err)); } } },
    ]);
  }

  async function handleAddTimeLog() {
    const h = parseFloat(logHours);
    if (isNaN(h) || h <= 0) return;
    setBusy(true);
    try { await createTimeLog(api, taskId, { hours: h, date: logDate }); setLogHours(''); const tl = await listTimeLogs(api, taskId); setTimeLogs(tl.entries); setTotalHours(tl.totalHours); setActivity(await listActivity(api, taskId)); }
    catch (err) { Alert.alert('Error', extractErrorMessage(err)); }
    finally { setBusy(false); }
  }

  async function handleDeleteTimeLog(id: number) {
    Alert.alert('Delete time log', 'Remove this entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await deleteTimeLog(api, id); const tl = await listTimeLogs(api, taskId); setTimeLogs(tl.entries); setTotalHours(tl.totalHours); } catch (err) { Alert.alert('Error', extractErrorMessage(err)); } } },
    ]);
  }

  function openDepPicker(direction: 'blocks' | 'blockedBy') {
    setDepDirection(direction);
    setDepPickerVisible(true);
  }

  async function handleAddDependency(otherTaskId: number) {
    setDepPickerVisible(false);
    setBusy(true);
    try {
      if (depDirection === 'blocks') await createDependency(api, taskId, otherTaskId);
      else await createDependency(api, otherTaskId, taskId);
      setDeps(await listDependencies(api, taskId));
      setActivity(await listActivity(api, taskId));
    } catch (err) { Alert.alert('Error', extractErrorMessage(err)); }
    finally { setBusy(false); }
  }

  async function handleRemoveDependency(depId: number) {
    Alert.alert('Remove dependency', 'Remove this link?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { try { await deleteDependency(api, depId); setDeps(await listDependencies(api, taskId)); } catch (err) { Alert.alert('Error', extractErrorMessage(err)); } } },
    ]);
  }

  function getInitials(name: string): string { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
  function avatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#0ea5e9', '#14b8a6', '#059669'];
    return colors[Math.abs(hash) % colors.length];
  }

  if (loading) return <View style={st.centered}><ActivityIndicator size="large" color="#0C66E4" /></View>;
  if (!task) return <View style={st.centered}><Text style={st.errorText}>Task not found</Text></View>;

  const sc = STATUS_CONFIG[task.status];
  const pc = PRIORITY_CONFIG[task.priority];
  const attachedIds = new Set(task.labels.map(l => l.id));
  const existingDepIds = new Set([...deps.blocks.map(d => d.task.id), ...deps.blockedBy.map(d => d.task.id), taskId]);
  const depCandidates = projectTasks.filter(t => !existingDepIds.has(t.id));

  return (
    <KeyboardAvoidingView style={st.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
      <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Title */}
        <TextInput style={st.titleInput} value={editTitle} onChangeText={v => { setEditTitle(v); setTitleDirty(true); }} onBlur={saveTitle} onSubmitEditing={saveTitle} returnKeyType="done" placeholder="Task title" placeholderTextColor="#9ca3af" />

        {/* Description */}
        <TextInput style={st.descInput} value={editDesc} onChangeText={v => { setEditDesc(v); setDescDirty(true); }} onBlur={saveDesc} placeholder="Add a description..." placeholderTextColor="#9ca3af" multiline />

        {/* Watch toggle */}
        <TouchableOpacity style={[st.watchButton, watching && st.watchingButton]} onPress={toggleWatch} disabled={busy}>
          <Text style={[st.watchText, watching && st.watchingText]}>{watching ? '👁 Watching' : '👁 Watch'}</Text>
        </TouchableOpacity>

        {/* Fields */}
        <View style={st.fieldsCard}>
          <Text style={st.sectionTitle}>Details</Text>
          <TouchableOpacity style={st.fieldRow} onPress={() => setMoveSheetVisible(true)} disabled={busy}>
            <Text style={st.fieldLabel}>Status</Text>
            <View style={[st.fieldBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
              <View style={[st.dot, { backgroundColor: sc.dotColor }]} />
              <Text style={[st.fieldBadgeText, { color: sc.text }]}>{sc.label} ▾</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={st.fieldRow} onPress={() => setPickerSheet({ field: 'priority', options: (['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TaskPriority[]).map(p => ({ label: PRIORITY_CONFIG[p].label, value: p })) })} disabled={busy}>
            <Text style={st.fieldLabel}>Priority</Text>
            <View style={[st.fieldBadge, { backgroundColor: pc.bg, borderColor: pc.border }]}>
              <Text style={[st.fieldBadgeText, { color: pc.text }]}>{pc.label} ▾</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={st.fieldRow} onPress={() => setPickerSheet({ field: 'assignee', options: [{ label: 'Unassigned', value: '' }, ...members.map(m => ({ label: m.user.fullName, value: String(m.userId) }))] })} disabled={busy}>
            <Text style={st.fieldLabel}>Assignee</Text>
            <Text style={st.fieldValue}>{task.assignee?.fullName ?? 'Unassigned'} ▾</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.fieldRow} onPress={() => setPickerSheet({ field: 'sprint', options: [{ label: 'None', value: '' }, ...sprints.map(sp => ({ label: sp.name, value: String(sp.id) }))] })} disabled={busy}>
            <Text style={st.fieldLabel}>Sprint</Text>
            <Text style={st.fieldValue}>{task.sprint?.name ?? 'None'} ▾</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.fieldRow} onPress={() => setShowDatePicker(true)} disabled={busy}>
            <Text style={st.fieldLabel}>Due Date</Text>
            <Text style={st.fieldValue}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'None'} ▾</Text>
          </TouchableOpacity>
          {showDatePicker && <DateTimePicker value={task.dueDate ? new Date(task.dueDate) : new Date()} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handleDueDateChange} />}
        </View>

        {/* Labels */}
        <View style={st.sectionCard}>
          <View style={st.sectionHeader}>
            <Text style={st.sectionTitle}>Labels</Text>
            <TouchableOpacity onPress={() => setLabelSheetVisible(true)}><Text style={st.addAction}>+ Add</Text></TouchableOpacity>
          </View>
          <View style={st.labelChips}>
            {task.labels.length === 0 && <Text style={st.muted}>No labels</Text>}
            {task.labels.map(label => (
              <View key={label.id} style={[st.labelChip, { backgroundColor: `${label.color}18`, borderColor: `${label.color}40` }]}>
                <View style={[st.labelDot, { backgroundColor: label.color }]} />
                <Text style={[st.labelChipText, { color: label.color }]}>{label.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Time Logs */}
        <View style={st.sectionCard}>
          <View style={st.sectionHeader}>
            <Text style={st.sectionTitle}>Time Logs</Text>
            <Text style={st.totalBadge}>{totalHours}h logged</Text>
          </View>
          {timeLogs.length === 0 && <Text style={st.muted}>No time logged yet</Text>}
          {[...timeLogs].reverse().map(entry => (
            <View key={entry.id} style={st.timeLogRow}>
              <View style={st.timeLogInfo}>
                <Text style={st.timeLogHours}>{entry.hours}h</Text>
                <Text style={st.timeLogMeta}>{entry.user.fullName} · {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteTimeLog(entry.id)} style={st.deleteBtn}><Text style={st.deleteBtnText}>✕</Text></TouchableOpacity>
            </View>
          ))}
          <View style={st.timeLogForm}>
            <TextInput style={st.timeLogInput} value={logHours} onChangeText={setLogHours} placeholder="Hours" placeholderTextColor="#9ca3af" keyboardType="decimal-pad" />
            <TouchableOpacity style={st.datePickerBtn} onPress={() => setShowLogDatePicker(true)}>
              <Text style={st.datePickerText}>{logDate}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.logBtn, (!logHours.trim() || busy) && st.btnDisabled]} onPress={handleAddTimeLog} disabled={!logHours.trim() || busy}>
              <Text style={st.logBtnText}>Log</Text>
            </TouchableOpacity>
          </View>
          {showLogDatePicker && <DateTimePicker value={new Date(logDate)} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_e, d) => { setShowLogDatePicker(Platform.OS === 'ios'); if (d) setLogDate(d.toISOString().split('T')[0]); }} />}
        </View>

        {/* Dependencies */}
        <View style={st.sectionCard}>
          <Text style={st.sectionTitle}>Dependencies</Text>
          <View style={st.depSection}>
            <View style={st.depHeader}>
              <Text style={st.depLabel}>Blocks ({deps.blocks.length})</Text>
              <TouchableOpacity onPress={() => openDepPicker('blocks')}><Text style={st.addAction}>+ Add</Text></TouchableOpacity>
            </View>
            {deps.blocks.length === 0 && <Text style={st.muted}>None</Text>}
            {deps.blocks.map(d => (
              <View key={d.dependencyId} style={st.depRow}>
                <TouchableOpacity style={st.depLink} onPress={() => navigation.push('TaskDetail', { taskId: d.task.id, projectId })}>
                  <View style={[st.dot, { backgroundColor: STATUS_CONFIG[d.task.status]?.dotColor ?? '#94a3b8' }]} />
                  <Text style={st.depTitle} numberOfLines={1}>{d.task.title}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemoveDependency(d.dependencyId)} style={st.deleteBtn}><Text style={st.deleteBtnText}>✕</Text></TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={[st.depSection, { marginTop: 12 }]}>
            <View style={st.depHeader}>
              <Text style={st.depLabel}>Blocked by ({deps.blockedBy.length})</Text>
              <TouchableOpacity onPress={() => openDepPicker('blockedBy')}><Text style={st.addAction}>+ Add</Text></TouchableOpacity>
            </View>
            {deps.blockedBy.length === 0 && <Text style={st.muted}>None</Text>}
            {deps.blockedBy.map(d => (
              <View key={d.dependencyId} style={st.depRow}>
                <TouchableOpacity style={st.depLink} onPress={() => navigation.push('TaskDetail', { taskId: d.task.id, projectId })}>
                  <View style={[st.dot, { backgroundColor: STATUS_CONFIG[d.task.status]?.dotColor ?? '#94a3b8' }]} />
                  <Text style={st.depTitle} numberOfLines={1}>{d.task.title}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemoveDependency(d.dependencyId)} style={st.deleteBtn}><Text style={st.deleteBtnText}>✕</Text></TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Activity */}
        <View style={st.sectionCard}>
          <Text style={st.sectionTitle}>Activity ({activity.length})</Text>
          {activity.length === 0 && <Text style={st.muted}>No activity yet</Text>}
          {activity.map(entry => (
            <View key={entry.id} style={st.activityRow}>
              <View style={[st.activityAvatar, { backgroundColor: avatarColor(entry.actor.fullName) }]}>
                <Text style={st.activityAvatarText}>{getInitials(entry.actor.fullName)}</Text>
              </View>
              <View style={st.activityBody}>
                <Text style={st.activityText}>
                  <Text style={st.activityActor}>{entry.actor.fullName}</Text>{' '}
                  {formatActivityLine(entry)}
                </Text>
                <Text style={st.activityTime}>{formatRelativeTime(entry.createdAt)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Attachments */}
        <View style={st.sectionCard}>
          <Text style={st.sectionTitle}>Attachments ({attachments.length})</Text>
          {attachments.length === 0 && <Text style={st.muted}>No attachments</Text>}
          {attachments.map(a => (
            <View key={a.id} style={st.attachmentRow}>
              <TouchableOpacity style={st.attachmentLink} onPress={() => Linking.openURL(a.fileUrl)}>
                <Text style={st.attachmentIcon}>📎</Text>
                <Text style={st.attachmentName} numberOfLines={1}>{a.fileName}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteAttachment(a.id)} style={st.deleteBtn}><Text style={st.deleteBtnText}>✕</Text></TouchableOpacity>
            </View>
          ))}
          <View style={st.attachForm}>
            <TextInput style={st.attachInput} value={attName} onChangeText={setAttName} placeholder="File name" placeholderTextColor="#9ca3af" />
            <TextInput style={st.attachInput} value={attUrl} onChangeText={setAttUrl} placeholder="File URL" placeholderTextColor="#9ca3af" autoCapitalize="none" />
            <TouchableOpacity style={[st.attachBtn, (!attName.trim() || !attUrl.trim() || busy) && st.btnDisabled]} onPress={handleAddAttachment} disabled={!attName.trim() || !attUrl.trim() || busy}>
              <Text style={st.attachBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments */}
        <View style={st.sectionCard}>
          <Text style={st.sectionTitle}>Comments ({comments.length})</Text>
          {comments.length === 0 && <Text style={st.muted}>No comments yet</Text>}
          {comments.map(c => (
            <View key={c.id} style={st.commentRow}>
              <View style={[st.commentAvatar, { backgroundColor: avatarColor(c.author.fullName) }]}>
                <Text style={st.commentAvatarText}>{getInitials(c.author.fullName)}</Text>
              </View>
              <View style={st.commentBody}>
                <View style={st.commentHeader}>
                  <Text style={st.commentAuthor}>{c.author.fullName}</Text>
                  <Text style={st.commentDate}>{formatRelativeTime(c.createdAt)}</Text>
                </View>
                <Text style={st.commentTextStyle}>{c.body}</Text>
              </View>
              {c.authorId === user?.id && (
                <TouchableOpacity onPress={() => handleDeleteComment(c.id)} style={st.deleteBtn}><Text style={st.deleteBtnText}>✕</Text></TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Comment composer pinned to bottom */}
      <View style={st.composerBar}>
        <TextInput style={st.composerInput} value={commentText} onChangeText={setCommentText} placeholder="Write a comment..." placeholderTextColor="#9ca3af" multiline />
        <TouchableOpacity style={[st.sendBtn, (!commentText.trim() || busy) && st.btnDisabled]} onPress={handlePostComment} disabled={!commentText.trim() || busy}>
          {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={st.sendBtnText}>Send</Text>}
        </TouchableOpacity>
      </View>

      {/* STATUS MOVE SHEET */}
      <Modal visible={moveSheetVisible} transparent animationType="slide">
        <TouchableOpacity style={st.sheetOverlay} activeOpacity={1} onPress={() => setMoveSheetVisible(false)}>
          <View style={st.sheetCard}>
            <Text style={st.sheetTitle}>Change Status</Text>
            <Text style={st.moveCurrentLabel}>Current: {sc.label}</Text>
            {(TRANSITIONS[task.status] ?? []).map(status => {
              const cfg = STATUS_CONFIG[status];
              return (
                <TouchableOpacity key={status} style={[st.moveOption, { backgroundColor: cfg.bg, borderColor: cfg.border }]} onPress={() => handleStatusMove(status)}>
                  <View style={[st.dot, { backgroundColor: cfg.dotColor }]} />
                  <Text style={[st.moveOptionText, { color: cfg.text }]}>Move to {cfg.label}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={st.sheetCancel} onPress={() => setMoveSheetVisible(false)}>
              <Text style={st.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* GENERIC PICKER SHEET */}
      <Modal visible={!!pickerSheet} transparent animationType="fade">
        <TouchableOpacity style={st.sheetOverlay} activeOpacity={1} onPress={() => setPickerSheet(null)}>
          <View style={st.sheetCard}>
            <Text style={st.sheetTitle}>Select</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {pickerSheet?.options.map(opt => (
                <TouchableOpacity key={opt.value} style={st.sheetOption} onPress={() => handleFieldChange(pickerSheet.field, opt.value)}>
                  <Text style={st.sheetOptionText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* LABEL SHEET */}
      <Modal visible={labelSheetVisible} transparent animationType="slide">
        <TouchableOpacity style={st.sheetOverlay} activeOpacity={1} onPress={() => setLabelSheetVisible(false)}>
          <View style={st.sheetCard}>
            <Text style={st.sheetTitle}>Manage Labels</Text>
            <ScrollView style={{ maxHeight: 280 }}>
              {projectLabels.map(label => {
                const attached = attachedIds.has(label.id);
                return (
                  <TouchableOpacity key={label.id} style={st.labelOption} onPress={() => handleToggleLabel(label.id, attached)}>
                    <View style={[st.labelDot, { backgroundColor: label.color }]} />
                    <Text style={st.labelOptionText}>{label.name}</Text>
                    {attached && <Text style={st.checkMark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={st.newLabelRow}>
              <TextInput style={st.newLabelInput} value={newLabelName} onChangeText={setNewLabelName} placeholder="New label name" placeholderTextColor="#9ca3af" />
              <TouchableOpacity style={st.colorSwatch} onPress={() => { const colors = ['#0C66E4', '#dc2626', '#059669', '#f59e0b', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6']; setNewLabelColor(colors[(colors.indexOf(newLabelColor) + 1) % colors.length]); }}>
                <View style={[st.swatchInner, { backgroundColor: newLabelColor }]} />
              </TouchableOpacity>
              <TouchableOpacity style={[st.newLabelBtn, !newLabelName.trim() && st.btnDisabled]} onPress={handleCreateLabel} disabled={!newLabelName.trim()}>
                <Text style={st.newLabelBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={st.sheetCancel} onPress={() => setLabelSheetVisible(false)}>
              <Text style={st.sheetCancelText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* DEPENDENCY PICKER SHEET */}
      <Modal visible={depPickerVisible} transparent animationType="slide">
        <TouchableOpacity style={st.sheetOverlay} activeOpacity={1} onPress={() => setDepPickerVisible(false)}>
          <View style={st.sheetCard}>
            <Text style={st.sheetTitle}>Add {depDirection === 'blocks' ? 'Blocked Task' : 'Blocking Task'}</Text>
            <ScrollView style={{ maxHeight: 350 }}>
              {depCandidates.length === 0 && <Text style={st.muted}>No tasks available to link</Text>}
              {depCandidates.map(t => (
                <TouchableOpacity key={t.id} style={st.depPickerRow} onPress={() => handleAddDependency(t.id)}>
                  <View style={[st.dot, { backgroundColor: STATUS_CONFIG[t.status]?.dotColor ?? '#94a3b8' }]} />
                  <Text style={st.depPickerText} numberOfLines={1}>{t.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={st.sheetCancel} onPress={() => setDepPickerVisible(false)}>
              <Text style={st.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
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
  totalBadge: { fontSize: 13, fontWeight: '700', color: '#0C66E4' },
  timeLogRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  timeLogInfo: { flex: 1 },
  timeLogHours: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  timeLogMeta: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  timeLogForm: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  timeLogInput: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: '#1a1a1a' },
  datePickerBtn: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  datePickerText: { fontSize: 13, color: '#1a1a1a' },
  logBtn: { backgroundColor: '#0C66E4', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  logBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  depSection: {},
  depHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  depLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  depRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  depLink: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  depTitle: { fontSize: 14, color: '#0C66E4', fontWeight: '500' },
  depPickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  depPickerText: { fontSize: 15, color: '#1a1a1a', flex: 1 },
  activityRow: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  activityAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  activityAvatarText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  activityBody: { flex: 1 },
  activityText: { fontSize: 13, color: '#374151' },
  activityActor: { fontWeight: '600', color: '#1a1a1a' },
  activityTime: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  commentRow: { flexDirection: 'row', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  commentAvatarText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  commentBody: { flex: 1 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  commentAuthor: { fontSize: 13, fontWeight: '600', color: '#1a1a1a' },
  commentDate: { fontSize: 11, color: '#9ca3af' },
  commentTextStyle: { fontSize: 14, color: '#374151' },
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
