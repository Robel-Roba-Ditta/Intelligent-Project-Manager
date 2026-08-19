import { useState, type FormEvent } from 'react';
import { AlertCircle, UserPlus, X, Crown, Shield, User } from 'lucide-react';
import {
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
  type ProjectDto,
  type ProjectMemberRole,
} from '../api/projectsApi';
import { extractErrorMessage } from '../../../common/lib/api';
import { getInitials, avatarColorForName } from '../../../common/lib/utils';

const ROLE_CONFIG: Record<ProjectMemberRole, { label: string; icon: typeof Crown; color: string; bg: string }> = {
  owner: { label: 'Owner', icon: Crown, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  admin: { label: 'Admin', icon: Shield, color: 'text-brand', bg: 'bg-brand-light border-brand/20' },
  member: { label: 'Member', icon: User, color: 'text-muted', bg: 'bg-canvas border-border-app' },
};

export function MembersPanel({
  project,
  currentUserId,
  onUpdate,
}: {
  project: ProjectDto;
  currentUserId: number;
  onUpdate: () => void;
}) {
  const [email, setEmail] = useState('');
  const [newRole, setNewRole] = useState<ProjectMemberRole>('member');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const currentMembership = project.members.find((m) => m.userId === currentUserId);
  const isOwner = currentMembership?.role === 'owner';
  const isAdmin = currentMembership?.role === 'admin' || isOwner;

  // Sort members: owner first, then admins, then members
  const sortedMembers = [...project.members].sort((a, b) => {
    const order: Record<string, number> = { owner: 0, admin: 1, member: 2 };
    return (order[a.role] ?? 3) - (order[b.role] ?? 3);
  });

  async function handleAddMember(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      await addProjectMember(project.id, { email, role: newRole });
      setSuccess(`Added ${email} as ${newRole}`);
      setEmail('');
      setNewRole('member');
      onUpdate();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRoleChange(userId: number, role: ProjectMemberRole) {
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      await updateProjectMemberRole(project.id, userId, role);
      onUpdate();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(userId: number, name: string) {
    const confirmed = window.confirm(`Remove ${name} from this project?`);
    if (!confirmed) return;
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      await removeProjectMember(project.id, userId);
      setSuccess(`Removed ${name}`);
      onUpdate();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Add member form — visible to admins/owners */}
      {isAdmin && (
        <div className="rounded-xl border border-border-app bg-surface p-5">
          <h3 className="mb-3 font-display text-sm font-semibold text-ink">Add a member</h3>
          <form onSubmit={handleAddMember} className="flex items-end gap-3">
            <div className="flex-1">
              <label htmlFor="invite-email" className="mb-1.5 block font-mono text-[11px] tracking-wide text-muted uppercase">
                Email address
              </label>
              <input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
                className="w-full rounded-lg border border-border-light bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label htmlFor="invite-role" className="mb-1.5 block font-mono text-[11px] tracking-wide text-muted uppercase">
                Role
              </label>
              <select
                id="invite-role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as ProjectMemberRole)}
                className="rounded-lg border border-border-light bg-white px-3 py-[9px] text-sm text-ink"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                {isOwner && <option value="owner">Owner</option>}
              </select>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserPlus size={15} />
              Invite
            </button>
          </form>
        </div>
      )}

      {/* Feedback alerts */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 rounded-lg border border-accent-done/30 bg-accent-done/5 px-3.5 py-2.5 text-sm text-accent-done-dim">
          <span>{success}</span>
        </div>
      )}

      {/* Members list */}
      <div className="rounded-xl border border-border-app bg-surface">
        <div className="border-b border-border-app px-5 py-3">
          <h3 className="font-display text-sm font-semibold text-ink">
            {project.members.length} {project.members.length === 1 ? 'member' : 'members'}
          </h3>
        </div>
        <ul className="divide-y divide-border-app">
          {sortedMembers.map((member) => {
            const roleConf = ROLE_CONFIG[member.role];
            const RoleIcon = roleConf.icon;
            const isSelf = member.userId === currentUserId;
            const canEditRole = isAdmin && member.role !== 'owner';
            const canRemove = isAdmin && member.role !== 'owner' && !isSelf;

            return (
              <li
                key={member.id}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-canvas/50"
              >
                {/* Avatar */}
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-xs font-medium text-white shadow-sm"
                  style={{ backgroundColor: avatarColorForName(member.user.fullName) }}
                >
                  {getInitials(member.user.fullName)}
                </span>

                {/* Name + email */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {member.user.fullName}
                    {isSelf && (
                      <span className="ml-1.5 text-xs font-normal text-muted">(you)</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted">{member.user.email}</p>
                </div>

                {/* Role badge or dropdown */}
                {canEditRole ? (
                  <select
                    value={member.role}
                    disabled={busy}
                    aria-label={`Change role for ${member.user.fullName}`}
                    onChange={(e) =>
                      handleRoleChange(member.userId, e.target.value as ProjectMemberRole)
                    }
                    className="rounded-lg border border-border-app bg-white px-2.5 py-1.5 text-xs font-medium text-ink transition-colors disabled:opacity-50"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    {isOwner && <option value="owner">Owner</option>}
                  </select>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${roleConf.bg} ${roleConf.color}`}
                  >
                    <RoleIcon size={12} />
                    {roleConf.label}
                  </span>
                )}

                {/* Remove button */}
                {canRemove ? (
                  <button
                    type="button"
                    aria-label={`Remove ${member.user.fullName}`}
                    disabled={busy}
                    onClick={() => handleRemove(member.userId, member.user.fullName)}
                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                  >
                    <X size={15} />
                  </button>
                ) : (
                  <div className="w-[30px]" /> /* spacer to keep alignment */
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
