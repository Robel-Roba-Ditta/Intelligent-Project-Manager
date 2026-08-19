import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Settings, Users, Layers, Timer, CheckSquare, Power, Trash2 } from 'lucide-react';
import { AppShell } from '../../../common/components/layout/AppShell';
import { MembersPanel } from '../components/MembersPanel';
import { EpicsPanel } from '../components/EpicsPanel';
import { SprintsPanel } from '../components/SprintsPanel';
import { TasksPanel } from '../components/TasksPanel';
import { ProjectFormModal } from '../components/ProjectFormModal';
import { useAuth } from '../../../common/context/AuthContext';
import {
  getProject,
  activateProject,
  deactivateProject,
  deleteProject,
  type ProjectDto,
} from '../api/projectsApi';
import { extractErrorMessage } from '../../../common/lib/api';
import { formatRelativeTime, getInitials, avatarColorForName } from '../../../common/lib/utils';
import { useNavigate } from 'react-router-dom';

type Tab = 'overview' | 'members' | 'epics' | 'sprints' | 'tasks';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [project, setProject] = useState<ProjectDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);

  const activeTab = (searchParams.get('tab') as Tab) || 'overview';

  const loadProject = useCallback(async () => {
    if (!id) return;
    try {
      setLoadError(null);
      const data = await getProject(Number(id));
      setProject(data);
    } catch (err) {
      setLoadError(extractErrorMessage(err));
    }
  }, [id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  if (!user) return null;

  // Permission checks
  const currentMembership = project?.members.find((m) => m.userId === user.id);
  const isOwner = currentMembership?.role === 'owner' || user.role === 'admin';
  const isAdmin = isOwner || currentMembership?.role === 'admin';

  function switchTab(tab: Tab) {
    setSearchParams(tab === 'overview' ? {} : { tab });
  }

  async function handleToggleActive() {
    if (!project) return;
    setActionError(null);
    try {
      if (project.isActive) {
        await deactivateProject(project.id);
      } else {
        await activateProject(project.id);
      }
      await loadProject();
    } catch (err) {
      setActionError(extractErrorMessage(err));
    }
  }

  async function handleDelete() {
    if (!project) return;
    const confirmed = window.confirm(
      `Delete "${project.name}"? This can't be undone.`,
    );
    if (!confirmed) return;
    try {
      await deleteProject(project.id);
      navigate('/projects', { replace: true });
    } catch (err) {
      setActionError(extractErrorMessage(err));
    }
  }

  return (
    <AppShell>
      {/* Back link */}
      <Link
        to="/projects"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} />
        All projects
      </Link>

      {/* Error states */}
      {loadError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Loading state */}
      {!project && !loadError && (
        <div className="flex h-40 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-app border-t-brand" />
        </div>
      )}

      {project && (
        <>
          {/* Project header */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-display text-2xl font-semibold text-ink">
                  {project.name}
                </h1>
                {!project.isActive && (
                  <span className="rounded-full bg-canvas px-2.5 py-0.5 text-xs font-medium text-muted">
                    Inactive
                  </span>
                )}
              </div>
              {project.description && (
                <p className="mt-1 max-w-xl text-sm text-muted">{project.description}</p>
              )}
              <p className="mt-2 text-xs text-muted">
                Created by {project.createdBy.fullName} · {formatRelativeTime(project.createdAt)}
              </p>
            </div>

            {/* Action buttons — visible to admins/owners */}
            {isAdmin && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFormModalOpen(true)}
                  title="Edit project"
                  className="rounded-lg p-2 text-muted transition-colors hover:bg-canvas hover:text-ink"
                >
                  <Settings size={16} />
                </button>
                {isOwner && (
                  <>
                    <button
                      type="button"
                      onClick={handleToggleActive}
                      title={project.isActive ? 'Deactivate project' : 'Activate project'}
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-canvas hover:text-ink"
                    >
                      <Power size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      title="Delete project"
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {actionError && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Tab bar */}
          <div className="mb-6 flex gap-1 border-b border-border-app">
            {([
              { key: 'overview' as Tab, label: 'Overview', icon: Settings },
              { key: 'members' as Tab, label: 'Members', icon: Users },
              { key: 'epics' as Tab, label: 'Epics', icon: Layers },
              { key: 'sprints' as Tab, label: 'Sprints', icon: Timer },
              { key: 'tasks' as Tab, label: 'Tasks', icon: CheckSquare },
            ]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => switchTab(key)}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === key
                    ? 'border-brand text-brand'
                    : 'border-transparent text-muted hover:text-ink'
                }`}
              >
                <Icon size={15} />
                {label}
                {key === 'members' && (
                  <span className="ml-1 rounded-full bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-muted">
                    {project.members.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border-app bg-surface p-5">
                <h3 className="mb-3 font-display text-sm font-semibold text-ink">Project details</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex gap-3">
                    <dt className="w-28 shrink-0 text-muted">Status</dt>
                    <dd>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          project.isActive
                            ? 'bg-accent-done/10 text-accent-done-dim'
                            : 'bg-canvas text-muted'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            project.isActive ? 'bg-accent-done' : 'bg-muted'
                          }`}
                        />
                        {project.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-28 shrink-0 text-muted">Description</dt>
                    <dd className="text-ink">{project.description || '—'}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-28 shrink-0 text-muted">Created by</dt>
                    <dd className="flex items-center gap-2 text-ink">
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full font-mono text-[8px] font-medium text-white"
                        style={{ backgroundColor: avatarColorForName(project.createdBy.fullName) }}
                      >
                        {getInitials(project.createdBy.fullName)}
                      </span>
                      {project.createdBy.fullName}
                    </dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-28 shrink-0 text-muted">Members</dt>
                    <dd className="text-ink">{project.members.length}</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-28 shrink-0 text-muted">Your role</dt>
                    <dd className="text-ink capitalize">{currentMembership?.role ?? 'Not a member'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <MembersPanel
              project={project}
              currentUserId={user.id}
              onUpdate={loadProject}
            />
          )}

          {activeTab === 'epics' && (
            <EpicsPanel projectId={project.id} />
          )}

          {activeTab === 'sprints' && (
            <SprintsPanel projectId={project.id} />
          )}

          {activeTab === 'tasks' && (
            <TasksPanel projectId={project.id} />
          )}

          <ProjectFormModal
            isOpen={formModalOpen}
            onClose={() => setFormModalOpen(false)}
            project={project}
            onSuccess={loadProject}
          />
        </>
      )}
    </AppShell>
  );
}
