import { useEffect, useState, useCallback } from 'react';
import { Plus, AlertCircle, FolderKanban } from 'lucide-react';
import { AppShell } from '../../../common/components/layout/AppShell';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectFormModal } from '../components/ProjectFormModal';
import { MembersModal } from '../components/MembersModal';
import { useAuth } from '../../../common/context/AuthContext';
import {
  listProjects,
  activateProject,
  deactivateProject,
  deleteProject,
  type ProjectDto,
} from '../api/projectsApi';
import { extractErrorMessage } from '../../../common/lib/api';

type Filter = 'all' | 'active' | 'inactive';

export function ProjectsList() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectDto[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectDto | null>(null);
  const [membersProject, setMembersProject] = useState<ProjectDto | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      setLoadError(null);
      const data = await listProjects();
      setProjects(data);
      setMembersProject((current) =>
        current ? (data.find((p) => p.id === current.id) ?? null) : null,
      );
    } catch (err) {
      setLoadError(extractErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  if (!user) return null;

  const visibleProjects = (projects ?? []).filter((p) => {
    if (filter === 'active') return p.isActive;
    if (filter === 'inactive') return !p.isActive;
    return true;
  });

  function canManage(project: ProjectDto): boolean {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return project.members.some(
      (m) => m.userId === user.id && (m.role === 'owner' || m.role === 'admin'),
    );
  }

  async function handleToggleActive(project: ProjectDto) {
    try {
      if (project.isActive) {
        await deactivateProject(project.id);
      } else {
        await activateProject(project.id);
      }
      await loadProjects();
    } catch (err) {
      setLoadError(extractErrorMessage(err));
    }
  }

  async function handleDelete(project: ProjectDto) {
    const confirmed = window.confirm(
      `Delete "${project.name}"? This can't be undone. Consider deactivating instead if you might need it later.`,
    );
    if (!confirmed) return;
    try {
      await deleteProject(project.id);
      await loadProjects();
    } catch (err) {
      setLoadError(extractErrorMessage(err));
    }
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Projects</h1>
          <p className="text-sm text-muted">Everything your team is working on.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingProject(null);
            setFormModalOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          <Plus size={16} />
          New project
        </button>
      </div>

      <div className="mb-5 flex gap-1">
        {(['all', 'active', 'inactive'] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-brand-light text-brand-dark' : 'text-muted hover:bg-canvas'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loadError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {projects === null && !loadError && (
        <div className="flex h-40 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-app border-t-brand" />
        </div>
      )}

      {projects !== null && visibleProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-app py-16 text-center">
          <FolderKanban size={28} className="text-muted" />
          <p className="mt-3 text-sm font-medium text-ink">
            {filter === 'all' ? 'No projects yet' : `No ${filter} projects`}
          </p>
          <p className="mt-1 text-sm text-muted">
            {filter === 'all' ? 'Create your first project to get started.' : 'Try a different filter.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            canManage={canManage(project)}
            onEdit={() => {
              setEditingProject(project);
              setFormModalOpen(true);
            }}
            onManageMembers={() => setMembersProject(project)}
            onToggleActive={() => handleToggleActive(project)}
            onDelete={() => handleDelete(project)}
          />
        ))}
      </div>

      <ProjectFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        project={editingProject}
        onSuccess={loadProjects}
      />

      {membersProject && (
        <MembersModal
          isOpen={!!membersProject}
          onClose={() => setMembersProject(null)}
          project={membersProject}
          currentUserId={user.id}
          onUpdate={loadProjects}
        />
      )}
    </AppShell>
  );
}
