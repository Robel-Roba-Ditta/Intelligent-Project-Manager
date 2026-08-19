import { Link } from 'react-router-dom';
import { Pencil, Users, Power, Trash2 } from 'lucide-react';
import type { ProjectDto } from '../api/projectsApi';
import { getInitials, avatarColorForName } from '../../../common/lib/utils';

export function ProjectCard({
  project,
  canManage,
  onEdit,
  onManageMembers,
  onToggleActive,
  onDelete,
}: {
  project: ProjectDto;
  canManage: boolean;
  onEdit: () => void;
  onManageMembers: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const visibleMembers = project.members.slice(0, 4);
  const extraCount = project.members.length - visibleMembers.length;

  return (
    <div
      data-testid={`project-card-${project.name}`}
      className={`rounded-xl border border-border-app bg-surface p-5 transition-opacity ${
        project.isActive ? '' : 'opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              to={`/projects/${project.id}`}
              className="truncate font-display text-base font-semibold text-ink hover:text-brand transition-colors"
            >
              {project.name}
            </Link>
            {!project.isActive && (
              <span className="shrink-0 rounded-full bg-canvas px-2 py-0.5 text-xs font-medium text-muted">
                Inactive
              </span>
            )}
          </div>
          {project.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted">{project.description}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onManageMembers}
          className="flex items-center -space-x-2 hover:opacity-80"
          aria-label="Manage members"
        >
          {visibleMembers.map((m) => (
            <span
              key={m.id}
              title={m.user.fullName}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface font-mono text-[10px] font-medium text-white"
              style={{ backgroundColor: avatarColorForName(m.user.fullName) }}
            >
              {getInitials(m.user.fullName)}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-canvas text-[10px] font-medium text-muted">
              +{extraCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onManageMembers}
            title="Members"
            className="rounded-lg p-1.5 text-muted hover:bg-canvas hover:text-ink"
          >
            <Users size={15} />
          </button>
          {canManage && (
            <>
              <button
                type="button"
                onClick={onEdit}
                title="Edit"
                className="rounded-lg p-1.5 text-muted hover:bg-canvas hover:text-ink"
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                onClick={onToggleActive}
                title={project.isActive ? 'Deactivate' : 'Activate'}
                className="rounded-lg p-1.5 text-muted hover:bg-canvas hover:text-ink"
              >
                <Power size={15} />
              </button>
              <button
                type="button"
                onClick={onDelete}
                title="Delete"
                className="rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
