import React, { useState } from 'react';
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
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
  extractErrorMessage,
} from '@ipm/shared';
import type { ProjectDto, ProjectMemberRole } from '@ipm/shared';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const RANK: Record<string, number> = { owner: 3, admin: 2, member: 1 };

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  owner: { label: 'Owner', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  admin: { label: 'Admin', color: '#0C66E4', bg: '#eff6ff', border: '#bfdbfe' },
  member: { label: 'Member', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
};

interface Props {
  project: ProjectDto;
  onUpdate: () => void;
}

export default function MembersTab({ project, onUpdate }: Props) {
  const { user } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [roleSheetVisible, setRoleSheetVisible] = useState(false);
  const [roleSheetTarget, setRoleSheetTarget] = useState<{ userId: number; name: string; currentRole: string } | null>(null);

  const currentMembership = project.members.find((m) => m.userId === user?.id);
  const isSiteAdmin = user?.role === 'admin';
  const myRank = isSiteAdmin ? 99 : (RANK[currentMembership?.role ?? ''] ?? 0);
  const isAdmin = myRank >= RANK.admin;
  const isOwner = myRank >= RANK.owner || isSiteAdmin;

  function canActOn(memberRole: string): boolean {
    return myRank > (RANK[memberRole] ?? 0);
  }

  function grantableRoles(): ProjectMemberRole[] {
    const roles: ProjectMemberRole[] = ['member', 'admin'];
    if (isOwner) roles.push('owner');
    return roles;
  }

  const sortedMembers = [...project.members].sort((a, b) => {
    return (RANK[b.role] ?? 0) - (RANK[a.role] ?? 0);
  });

  async function handleAddMember() {
    if (!email.trim()) return;
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      await addProjectMember(api, project.id, { email: email.trim() });
      setSuccess(`Added ${email.trim()}`);
      setEmail('');
      onUpdate();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function openRoleSheet(userId: number, name: string, currentRole: string) {
    setRoleSheetTarget({ userId, name, currentRole });
    setRoleSheetVisible(true);
  }

  async function handleRoleChange(role: ProjectMemberRole) {
    if (!roleSheetTarget) return;
    setRoleSheetVisible(false);
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      await updateProjectMemberRole(api, project.id, roleSheetTarget.userId, role);
      onUpdate();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(userId: number, name: string) {
    Alert.alert(
      'Remove member',
      `Remove ${name} from this project?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setError(null);
            setSuccess(null);
            setBusy(true);
            try {
              await removeProjectMember(api, project.id, userId);
              setSuccess(`Removed ${name}`);
              onUpdate();
            } catch (err) {
              setError(extractErrorMessage(err));
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  function avatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#0ea5e9', '#14b8a6', '#059669'];
    return colors[Math.abs(hash) % colors.length];
  }

  return (
    <View style={styles.flex}>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={sortedMembers}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View>
            {isAdmin && (
              <View style={styles.addCard}>
                <Text style={styles.addTitle}>Add a member</Text>
                <View style={styles.addRow}>
                  <TextInput
                    style={styles.addInput}
                    placeholder="teammate@example.com"
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!busy}
                  />
                  <TouchableOpacity
                    style={[styles.addButton, busy && styles.buttonDisabled]}
                    onPress={handleAddMember}
                    disabled={busy}
                  >
                    <Text style={styles.addButtonText}>Invite</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            {success && (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{success}</Text>
              </View>
            )}

            <Text style={styles.countText}>
              {project.members.length} {project.members.length === 1 ? 'member' : 'members'}
            </Text>
          </View>
        }
        renderItem={({ item: member }) => {
          const rc = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.member;
          const isSelf = member.userId === user?.id;
          const canEdit = isAdmin && canActOn(member.role);
          const canRemove = canEdit && !isSelf;

          return (
            <View style={styles.memberRow}>
              <View style={[styles.avatar, { backgroundColor: avatarColor(member.user.fullName) }]}>
                <Text style={styles.avatarText}>{getInitials(member.user.fullName)}</Text>
              </View>

              <View style={styles.memberInfo}>
                <Text style={styles.memberName} numberOfLines={1}>
                  {member.user.fullName}
                  {isSelf && <Text style={styles.youTag}> (you)</Text>}
                </Text>
                <Text style={styles.memberEmail} numberOfLines={1}>{member.user.email}</Text>
              </View>

              {canEdit ? (
                <TouchableOpacity
                  style={[styles.roleBadge, { backgroundColor: rc.bg, borderColor: rc.border }]}
                  onPress={() => openRoleSheet(member.userId, member.user.fullName, member.role)}
                  disabled={busy}
                >
                  <Text style={[styles.roleText, { color: rc.color }]}>{rc.label} ▾</Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.roleBadge, { backgroundColor: rc.bg, borderColor: rc.border }]}>
                  <Text style={[styles.roleText, { color: rc.color }]}>{rc.label}</Text>
                </View>
              )}

              {canRemove ? (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemove(member.userId, member.user.fullName)}
                  disabled={busy}
                >
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ width: 30 }} />
              )}
            </View>
          );
        }}
      />

      <Modal visible={roleSheetVisible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setRoleSheetVisible(false)}
        >
          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>
              Change role for {roleSheetTarget?.name}
            </Text>
            {grantableRoles().map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.sheetOption,
                  roleSheetTarget?.currentRole === role && styles.sheetOptionActive,
                ]}
                onPress={() => handleRoleChange(role)}
              >
                <Text
                  style={[
                    styles.sheetOptionText,
                    roleSheetTarget?.currentRole === role && styles.sheetOptionTextActive,
                  ]}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                  {roleSheetTarget?.currentRole === role ? '  ✓' : ''}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.sheetCancel}
              onPress={() => setRoleSheetVisible(false)}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
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
  addCard: {
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
  addTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 10 },
  addRow: { flexDirection: 'row', gap: 8 },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#1a1a1a',
  },
  addButton: {
    backgroundColor: '#0C66E4',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  buttonDisabled: { opacity: 0.5 },
  errorBox: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 8, padding: 10, marginBottom: 12 },
  errorText: { color: '#dc2626', fontSize: 13 },
  successBox: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 8, padding: 10, marginBottom: 12 },
  successText: { color: '#059669', fontSize: 13 },
  countText: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 10 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 10,
  },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  memberInfo: { flex: 1, minWidth: 0 },
  memberName: { fontSize: 14, fontWeight: '500', color: '#1a1a1a' },
  youTag: { color: '#9ca3af', fontWeight: '400', fontSize: 12 },
  memberEmail: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  roleText: { fontSize: 11, fontWeight: '600' },
  removeButton: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  removeText: { color: '#dc2626', fontSize: 14, fontWeight: '600' },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheetCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  sheetTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 16 },
  sheetOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  sheetOptionActive: { backgroundColor: '#eff6ff' },
  sheetOptionText: { fontSize: 16, color: '#1a1a1a' },
  sheetOptionTextActive: { color: '#0C66E4', fontWeight: '600' },
  sheetCancel: { marginTop: 12, paddingVertical: 14, alignItems: 'center' },
  sheetCancelText: { fontSize: 16, color: '#6b7280', fontWeight: '500' },
});
