import { useState, type FormEvent } from 'react';
import { AlertCircle, UserPlus, X } from 'lucide-react';
import { Modal } from '../../../common/components/Modal';
import {
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
  type ProjectDto,
  type ProjectMemberRole,
} from '../api/projectsApi';
import { extractErrorMessage } from '../../../common/lib/api';
import { getInitials, avatarColorForName } from '../../../common/lib/utils';

export function MembersModal({
  isOpen,
  onClose,
  project,
  currentUserId,
  onUpdate,
}: {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectDto;
  currentUserId: number;
  onUpdate: (project: ProjectDto) => void;
}) {
  const [email, setEmail] = useState('');
  const [newRole, setNewRole] = useState<ProjectMemberRole>('member');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isCurrentUserAdmin = project.members.some(
    (m) => m.userId === currentUserId && (m.role === 'owner' || m.role === 'admin'),
  );

  async function handleAddMember(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const updated = await addProjectMember(project.id, { email, role: newRole });
      onUpdate(updated);
      setEmail('');
      setNewRole('member');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRoleChange(userId: number, role: ProjectMemberRole) {
    setError(null);
    setBusy(true);
    try {
      const updated = await updateProjectMemberRole(project.id, userId, role);
      onUpdate(updated);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(userId: number) {
    setError(null);
    setBusy(true);
    try {
      const updated = await removeProjectMember(project.id, userId);
      onUpdate(updated);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Members · ${project.name}`}>
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <ul className="max-h-64 space-y-1 overflow-y-auto">
        {project.members.map((member) => (
          <li
            key={member.id}
            className="flex items-center gap-3 rounded-lg px-1 py-2 hover:bg-canvas"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-xs font-medium text-white"
              style={{ backgroundColor: avatarColorForName(member.user.fullName) }}
            >
              {getInitials(member.user.fullName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">
                {member.user.fullName}
                {member.userId === currentUserId && (
                  <span className="ml-1.5 text-xs font-normal text-muted">(you)</span>
                )}
              </p>
              <p className="truncate text-xs text-muted">{member.user.email}</p>
            </div>

            {isCurrentUserAdmin ? (
              <>
                <select
                  value={member.role}
                  disabled={busy}
                  aria-label={`Change role for ${member.user.fullName}`}
                  onChange={(e) =>
                    handleRoleChange(member.userId, e.target.value as ProjectMemberRole)
                  }
                  className="rounded-md border border-border-app bg-white px-2 py-1 text-xs text-ink disabled:opacity-50"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="button"
                  aria-label={`Remove ${member.user.fullName}`}
                  disabled={busy}
                  onClick={() => handleRemove(member.userId)}
                  className="rounded p-1 text-muted hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                >
                  <X size={15} />
                </button>
              </>
            ) : (
              <span className="shrink-0 rounded-full bg-canvas px-2 py-0.5 text-xs font-medium text-muted capitalize">
                {member.role}
              </span>
            )}
          </li>
        ))}
      </ul>

      {isCurrentUserAdmin && (
        <form
          onSubmit={handleAddMember}
          className="mt-4 flex items-end gap-2 border-t border-border-app pt-4"
        >
          <div className="flex-1">
            <label htmlFor="member-email" className="mb-1 block text-xs font-medium text-muted">
              Add member by email
            </label>
            <input
              id="member-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@example.com"
              className="w-full rounded-lg border border-border-light bg-white px-3 py-1.5 text-sm text-ink placeholder:text-muted/60 focus:border-accent-done focus:outline-none focus:ring-2 focus:ring-accent-done/40"
            />
          </div>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as ProjectMemberRole)}
            className="rounded-lg border border-border-light bg-white px-2 py-[7px] text-sm text-ink"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={busy}
            aria-label="Add member"
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-ink text-paper transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UserPlus size={15} />
          </button>
        </form>
      )}
    </Modal>
  );
}
