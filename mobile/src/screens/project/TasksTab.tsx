import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  listTasks,
  createTask,
  deleteTask,
  changeTaskStatus,
  listEpics,
  listSprints,
  listProjectMembers,
  extractErrorMessage,
} from '@ipm/shared';
import type {
  TaskDto,
  TaskStatus,
  TaskPriority,
  TaskType,
  TaskFilters,
  EpicDto,
  SprintDto,
  ProjectMemberDto,
} from '@ipm/shared';
import { api } from '../../lib/api';

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

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

interface Props {
  projectId: number;
}

export default function TasksTab({ projectId }: Props) {
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [epics, setEpics] = useState<EpicDto[]>([]);
  const [sprints, setSprints] = useState<SprintDto[]>([]);
  const [members, setMembers] = useState<ProjectMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterSprint, setFilterSprint] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [tempFilters, setTempFilters] = useState({ status: '', priority: '', assignee: '', sprint: '', search: '' });

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('MEDIUM');
  const [formType, setFormType] = useState<TaskType>('TASK');
  const [formAssigneeId, setFormAssigneeId] = useState('');
  const [formEpicId, setFormEpicId] = useState('');
  const [formSprintId, setFormSprintId] = useState('');
  const [formParentTaskId, setFormParentTaskId] = useState('');
  const [formDueDate, setFormDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Picker sheets
  const [pickerSheet, setPickerSheet] = useState<{ field: string; options: { label: string; value: string }[] } | null>(null);

  // Board move sheet
  const [moveSheet, setMoveSheet] = useState<{ task: TaskDto; legalMoves: TaskStatus[] } | null>(null);

  // Board column
  const [boardColumn, setBoardColumn] = useState(0);
  const boardRef = useRef<ScrollView>(null);

  const activeFilterCount = [filterStatus, filterPriority, filterAssignee, filterSprint, filterSearch].filter(Boolean).length;

  const load = useCallback(async () => {
    try {
      setError(null);
      const filters: TaskFilters = {};
      if (filterStatus) filters.status = filterStatus;
      if (filterPriority) filters.priority = filterPriority;
      if (filterAssignee) filters.assigneeId = Number(filterAssignee);
      if (filterSprint) filters.sprintId = Number(filterSprint);
      if (filterSearch) filters.search = filterSearch;

      const [t, e, s, m] = await Promise.all([
        listTasks(api, projectId, Object.keys(filters).length > 0 ? filters : undefined),
        listEpics(api, projectId),
        listSprints(api, projectId),
        listProjectMembers(api, projectId),
      ]);
      setTasks(t);
      setEpics(e);
      setSprints(s);
      setMembers(m);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [projectId, filterStatus, filterPriority, filterAssignee, filterSprint, filterSearch]);

  useEffect(() => { load(); }, [load]);

  function openFilterSheet() {
    setTempFilters({ status: filterStatus, priority: filterPriority, assignee: filterAssignee, sprint: filterSprint, search: filterSearch });
    setShowFilterSheet(true);
  }

  function applyFilters() {
    setFilterStatus(tempFilters.status);
    setFilterPriority(tempFilters.priority);
    setFilterAssignee(tempFilters.assignee);
    setFilterSprint(tempFilters.sprint);
    setFilterSearch(tempFilters.search);
    setShowFilterSheet(false);
  }

  function clearFilters() {
    setTempFilters({ status: '', priority: '', assignee: '', sprint: '', search: '' });
  }

  function openCreateForm() {
    setFormTitle('');
    setFormDesc('');
    setFormPriority('MEDIUM');
    setFormType('TASK');
    setFormAssigneeId('');
    setFormEpicId('');
    setFormSprintId('');
    setFormParentTaskId('');
    setFormDueDate(null);
    setShowCreateForm(true);
  }

  async function handleCreate() {
    if (!formTitle.trim()) return;
    setError(null);
    setBusy(true);
    try {
      await createTask(api, projectId, {
        title: formTitle.trim(),
        description: formDesc.trim() || undefined,
        priority: formPriority,
        type: formType,
        assigneeId: formAssigneeId ? Number(formAssigneeId) : undefined,
        epicId: formEpicId ? Number(formEpicId) : undefined,
        sprintId: formSprintId ? Number(formSprintId) : undefined,
        parentTaskId: formParentTaskId ? Number(formParentTaskId) : undefined,
        dueDate: formDueDate ? formDueDate.toISOString().split('T')[0] : undefined,
      });
      setShowCreateForm(false);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: number, title: string) {
    Alert.alert('Delete task', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await deleteTask(api, id);
            await load();
          } catch (err) {
            Alert.alert('Error', extractErrorMessage(err));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  function openMoveSheet(task: TaskDto) {
    const legal = TRANSITIONS[task.status] ?? [];
    setMoveSheet({ task, legalMoves: legal });
  }

  async function handleMoveTask(taskId: number, newStatus: TaskStatus) {
    setMoveSheet(null);
    setBusy(true);
    try {
      await changeTaskStatus(api, taskId, newStatus);
      await load();
    } catch (err) {
      Alert.alert('Error', extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function openPickerSheet(field: string, options: { label: string; value: string }[]) {
    setPickerSheet({ field, options });
  }

  function handlePickerSelect(value: string) {
    if (!pickerSheet) return;
    const f = pickerSheet.field;
    if (f === 'priority') setFormPriority(value as TaskPriority);
    else if (f === 'type') setFormType(value as TaskType);
    else if (f === 'assignee') setFormAssigneeId(value);
    else if (f === 'epic') setFormEpicId(value);
    else if (f === 'sprint') setFormSprintId(value);
    else if (f === 'parent') setFormParentTaskId(value);
    else if (f === 'filter_status') setTempFilters(prev => ({ ...prev, status: value }));
    else if (f === 'filter_priority') setTempFilters(prev => ({ ...prev, priority: value }));
    else if (f === 'filter_assignee') setTempFilters(prev => ({ ...prev, assignee: value }));
    else if (f === 'filter_sprint') setTempFilters(prev => ({ ...prev, sprint: value }));
    setPickerSheet(null);
  }

  function getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  function avatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#0ea5e9', '#14b8a6', '#059669'];
    return colors[Math.abs(hash) % colors.length];
  }

  function formatDueDate(d: string | null): string {
    if (!d) return '';
    const date = new Date(d);
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Board columns data
  const boardData = useMemo(() => {
    return BOARD_STATUSES.map(status => ({
      status,
      config: STATUS_CONFIG[status],
      tasks: tasks.filter(t => t.status === status),
    }));
  }, [tasks]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#0C66E4" /></View>;
  }

  const topLevelTasks = tasks.filter(t => !t.parentTaskId);
  const parentCandidates = tasks.filter(t => !t.parentTaskId);

  function renderTaskCard(task: TaskDto) {
    const sc = STATUS_CONFIG[task.status];
    const pc = PRIORITY_CONFIG[task.priority];
    return (
      <TouchableOpacity
        key={String(task.id)}
        style={styles.taskCard}
        activeOpacity={0.7}
        onPress={() => openMoveSheet(task)}
        onLongPress={() => handleDelete(task.id, task.title)}
      >
        <View style={styles.taskHeader}>
          <View style={[styles.dot, { backgroundColor: sc.dotColor }]} />
          <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
        </View>

        {task.parent && (
          <Text style={styles.subtaskLabel} numberOfLines={1}>Subtask of {task.parent.title}</Text>
        )}

        <View style={styles.taskBadgeRow}>
          <View style={[styles.badge, { backgroundColor: pc.bg, borderColor: pc.border }]}>
            <Text style={[styles.badgeText, { color: pc.text }]}>{pc.label}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <Text style={[styles.badgeText, { color: sc.text }]}>{sc.label}</Text>
          </View>
        </View>

        <View style={styles.taskMetaRow}>
          {task.assignee && (
            <View style={styles.assigneeChip}>
              <View style={[styles.miniAvatar, { backgroundColor: avatarColor(task.assignee.fullName) }]}>
                <Text style={styles.miniAvatarText}>{getInitials(task.assignee.fullName)}</Text>
              </View>
              <Text style={styles.taskMetaText} numberOfLines={1}>{task.assignee.fullName}</Text>
            </View>
          )}
          {task.dueDate && (
            <Text style={[styles.taskMetaText, task.dueDate && new Date(task.dueDate) < new Date() ? styles.overdueText : null]}>
              {formatDueDate(task.dueDate)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.flex}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Text style={styles.countText}>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</Text>
          <TouchableOpacity style={styles.filterButton} onPress={openFilterSheet}>
            <Text style={styles.filterButtonText}>⚙ Filter</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'list' && styles.toggleActive]}
              onPress={() => setViewMode('list')}
            >
              <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>List</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'board' && styles.toggleActive]}
              onPress={() => setViewMode('board')}
            >
              <Text style={[styles.toggleText, viewMode === 'board' && styles.toggleTextActive]}>Board</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.newButton} onPress={openCreateForm}>
            <Text style={styles.newButtonText}>+ New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={tasks}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => renderTaskCard(item)}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No tasks yet. Tap "+ New" to create one.</Text>
            </View>
          }
        />
      )}

      {/* BOARD VIEW */}
      {viewMode === 'board' && (
        <View style={styles.boardContainer}>
          <View style={styles.boardTabRow}>
            {BOARD_STATUSES.map((status, i) => (
              <TouchableOpacity
                key={status}
                style={[styles.boardTab, boardColumn === i && styles.boardTabActive]}
                onPress={() => {
                  setBoardColumn(i);
                  boardRef.current?.scrollTo({ x: i * SCREEN_WIDTH, animated: true });
                }}
              >
                <View style={[styles.dot, { backgroundColor: STATUS_CONFIG[status].dotColor }]} />
                <Text style={[styles.boardTabText, boardColumn === i && styles.boardTabTextActive]} numberOfLines={1}>
                  {STATUS_CONFIG[status].label}
                </Text>
                <Text style={styles.boardTabCount}>{boardData[i].tasks.length}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <ScrollView
            ref={boardRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setBoardColumn(page);
            }}
          >
            {boardData.map((col) => (
              <View key={col.status} style={[styles.boardColumn, { width: SCREEN_WIDTH }]}>
                <FlatList
                  data={col.tasks}
                  keyExtractor={item => String(item.id)}
                  contentContainerStyle={styles.boardColumnContent}
                  renderItem={({ item }) => renderTaskCard(item)}
                  ListEmptyComponent={
                    <View style={styles.boardEmpty}>
                      <Text style={styles.emptyText}>No tasks</Text>
                    </View>
                  }
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* FILTER SHEET */}
      <Modal visible={showFilterSheet} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>Filter Tasks</Text>

            <Text style={styles.fieldLabel}>Search</Text>
            <TextInput
              style={styles.input}
              value={tempFilters.search}
              onChangeText={v => setTempFilters(prev => ({ ...prev, search: v }))}
              placeholder="Search by keyword..."
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.fieldLabel}>Status</Text>
            <TouchableOpacity style={styles.pickerField} onPress={() => openPickerSheet('filter_status', [
              { label: 'All statuses', value: '' },
              ...BOARD_STATUSES.map(s => ({ label: STATUS_CONFIG[s].label, value: s })),
            ])}>
              <Text style={styles.pickerFieldText}>{tempFilters.status ? STATUS_CONFIG[tempFilters.status as TaskStatus]?.label : 'All statuses'} ▾</Text>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Priority</Text>
            <TouchableOpacity style={styles.pickerField} onPress={() => openPickerSheet('filter_priority', [
              { label: 'All priorities', value: '' },
              ...(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TaskPriority[]).map(p => ({ label: PRIORITY_CONFIG[p].label, value: p })),
            ])}>
              <Text style={styles.pickerFieldText}>{tempFilters.priority ? PRIORITY_CONFIG[tempFilters.priority as TaskPriority]?.label : 'All priorities'} ▾</Text>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Assignee</Text>
            <TouchableOpacity style={styles.pickerField} onPress={() => openPickerSheet('filter_assignee', [
              { label: 'All assignees', value: '' },
              ...members.map(m => ({ label: m.user.fullName, value: String(m.userId) })),
            ])}>
              <Text style={styles.pickerFieldText}>{tempFilters.assignee ? members.find(m => String(m.userId) === tempFilters.assignee)?.user.fullName ?? 'Unknown' : 'All assignees'} ▾</Text>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Sprint</Text>
            <TouchableOpacity style={styles.pickerField} onPress={() => openPickerSheet('filter_sprint', [
              { label: 'All sprints', value: '' },
              ...sprints.map(s => ({ label: s.name, value: String(s.id) })),
            ])}>
              <Text style={styles.pickerFieldText}>{tempFilters.sprint ? sprints.find(s => String(s.id) === tempFilters.sprint)?.name ?? 'Unknown' : 'All sprints'} ▾</Text>
            </TouchableOpacity>

            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                <Text style={styles.clearBtnText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowFilterSheet(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CREATE FORM SHEET */}
      <Modal visible={showCreateForm} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <ScrollView style={styles.sheetCard} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.sheetTitle}>New Task</Text>

            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput style={styles.input} value={formTitle} onChangeText={setFormTitle} placeholder="Task title" placeholderTextColor="#9ca3af" autoFocus />

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput style={[styles.input, styles.textArea]} value={formDesc} onChangeText={setFormDesc} placeholder="Optional description" placeholderTextColor="#9ca3af" multiline numberOfLines={3} />

            <Text style={styles.fieldLabel}>Priority</Text>
            <TouchableOpacity style={styles.pickerField} onPress={() => openPickerSheet('priority', (['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TaskPriority[]).map(p => ({ label: PRIORITY_CONFIG[p].label, value: p })))}>
              <Text style={styles.pickerFieldText}>{PRIORITY_CONFIG[formPriority].label} ▾</Text>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Type</Text>
            <TouchableOpacity style={styles.pickerField} onPress={() => openPickerSheet('type', [
              { label: 'Task', value: 'TASK' }, { label: 'Bug', value: 'BUG' }, { label: 'Story', value: 'STORY' },
            ])}>
              <Text style={styles.pickerFieldText}>{formType} ▾</Text>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Assignee</Text>
            <TouchableOpacity style={styles.pickerField} onPress={() => openPickerSheet('assignee', [
              { label: 'Unassigned', value: '' },
              ...members.map(m => ({ label: m.user.fullName, value: String(m.userId) })),
            ])}>
              <Text style={styles.pickerFieldText}>{formAssigneeId ? members.find(m => String(m.userId) === formAssigneeId)?.user.fullName ?? 'Unknown' : 'Unassigned'} ▾</Text>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Epic</Text>
            <TouchableOpacity style={styles.pickerField} onPress={() => openPickerSheet('epic', [
              { label: 'None', value: '' },
              ...epics.map(e => ({ label: e.name, value: String(e.id) })),
            ])}>
              <Text style={styles.pickerFieldText}>{formEpicId ? epics.find(e => String(e.id) === formEpicId)?.name ?? 'Unknown' : 'None'} ▾</Text>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Sprint</Text>
            <TouchableOpacity style={styles.pickerField} onPress={() => openPickerSheet('sprint', [
              { label: 'None', value: '' },
              ...sprints.map(s => ({ label: s.name, value: String(s.id) })),
            ])}>
              <Text style={styles.pickerFieldText}>{formSprintId ? sprints.find(s => String(s.id) === formSprintId)?.name ?? 'Unknown' : 'None'} ▾</Text>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Parent Task</Text>
            <TouchableOpacity style={styles.pickerField} onPress={() => openPickerSheet('parent', [
              { label: 'None (top-level)', value: '' },
              ...parentCandidates.map(t => ({ label: t.title, value: String(t.id) })),
            ])}>
              <Text style={styles.pickerFieldText}>{formParentTaskId ? parentCandidates.find(t => String(t.id) === formParentTaskId)?.title ?? 'Unknown' : 'None (top-level)'} ▾</Text>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Due Date</Text>
            <TouchableOpacity style={styles.pickerField} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.pickerFieldText}>{formDueDate ? formDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date'} ▾</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={formDueDate ?? new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) setFormDueDate(date);
                }}
              />
            )}

            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreateForm(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.applyBtn, busy && styles.buttonDisabled]} onPress={handleCreate} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.applyBtnText}>Create Task</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* GENERIC PICKER SHEET */}
      <Modal visible={!!pickerSheet} transparent animationType="fade">
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setPickerSheet(null)}>
          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>Select</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {pickerSheet?.options.map(opt => (
                <TouchableOpacity key={opt.value} style={styles.sheetOption} onPress={() => handlePickerSelect(opt.value)}>
                  <Text style={styles.sheetOptionText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MOVE SHEET */}
      <Modal visible={!!moveSheet} transparent animationType="slide">
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setMoveSheet(null)}>
          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>Move "{moveSheet?.task.title}"</Text>
            <Text style={styles.moveCurrentLabel}>
              Current: {moveSheet?.task.status ? STATUS_CONFIG[moveSheet.task.status].label : ''}
            </Text>
            {moveSheet?.legalMoves.map(status => (
              <TouchableOpacity
                key={status}
                style={[styles.moveOption, { backgroundColor: STATUS_CONFIG[status].bg, borderColor: STATUS_CONFIG[status].border }]}
                onPress={() => handleMoveTask(moveSheet.task.id, status)}
              >
                <View style={[styles.dot, { backgroundColor: STATUS_CONFIG[status].dotColor }]} />
                <Text style={[styles.moveOptionText, { color: STATUS_CONFIG[status].text }]}>
                  Move to {STATUS_CONFIG[status].label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.sheetCancel} onPress={() => setMoveSheet(null)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countText: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#e5e7eb' },
  filterButtonText: { fontSize: 12, color: '#6b7280' },
  filterBadge: { backgroundColor: '#0C66E4', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  filterBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  viewToggle: { flexDirection: 'row', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, overflow: 'hidden' },
  toggleButton: { paddingHorizontal: 12, paddingVertical: 5 },
  toggleActive: { backgroundColor: '#0C66E4' },
  toggleText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  toggleTextActive: { color: '#fff' },
  newButton: { backgroundColor: '#0C66E4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  newButtonText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  list: { flex: 1 },
  listContent: { padding: 16 },
  taskCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  taskHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  taskTitle: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1a1a1a' },
  subtaskLabel: { fontSize: 11, color: '#a855f7', marginTop: 4, fontStyle: 'italic' },
  taskBadgeRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  taskMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  assigneeChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  miniAvatar: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  miniAvatarText: { color: '#fff', fontSize: 8, fontWeight: '600' },
  taskMetaText: { fontSize: 11, color: '#6b7280' },
  overdueText: { color: '#dc2626' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#9ca3af' },
  errorBox: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 8, padding: 10, marginHorizontal: 16, marginTop: 8 },
  errorText: { color: '#dc2626', fontSize: 13 },
  boardContainer: { flex: 1 },
  boardTabRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingHorizontal: 4 },
  boardTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  boardTabActive: { borderBottomColor: '#0C66E4' },
  boardTabText: { fontSize: 11, color: '#6b7280', fontWeight: '500' },
  boardTabTextActive: { color: '#0C66E4' },
  boardTabCount: { fontSize: 10, color: '#9ca3af', backgroundColor: '#f3f4f6', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6, overflow: 'hidden' },
  boardColumn: { flex: 1 },
  boardColumnContent: { padding: 16, paddingTop: 8 },
  boardEmpty: { alignItems: 'center', paddingVertical: 32 },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheetCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, maxHeight: '80%' },
  sheetTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#1a1a1a', marginBottom: 4 },
  textArea: { height: 70, textAlignVertical: 'top' },
  pickerField: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 4 },
  pickerFieldText: { fontSize: 15, color: '#1a1a1a' },
  sheetActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  clearBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  clearBtnText: { fontSize: 14, color: '#dc2626', fontWeight: '500' },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelBtnText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  applyBtn: { backgroundColor: '#0C66E4', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  applyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
  sheetOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  sheetOptionText: { fontSize: 16, color: '#1a1a1a' },
  moveCurrentLabel: { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  moveOption: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  moveOptionText: { fontSize: 15, fontWeight: '500' },
  sheetCancel: { marginTop: 8, paddingVertical: 14, alignItems: 'center' },
  sheetCancelText: { fontSize: 16, color: '#6b7280', fontWeight: '500' },
});
