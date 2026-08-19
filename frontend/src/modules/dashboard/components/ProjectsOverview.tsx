import { Link } from 'react-router-dom';
import { FolderKanban, ArrowRight } from 'lucide-react';
import type { Project } from '../../../common/types/types';

export function ProjectsOverview({ projects }: { projects: Project[] }) {
  return (
    <div className="rounded-xl border border-border-app bg-surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink">Projects</h3>
        <Link
          to="/projects"
          className="flex items-center gap-1 text-xs font-medium text-brand hover:underline"
        >
          View all
          <ArrowRight size={12} />
        </Link>
      </div>
      <p className="text-sm text-muted">{projects.length} active</p>

      <ul className="mt-4 space-y-1">
        {projects.map((project) => {
          const percent = Math.round((project.completedTasks / project.totalTasks) * 100);
          return (
            <li key={project.id}>
              <Link
                to="/projects"
                className="-mx-2 block rounded-lg px-2 py-1.5 transition-colors hover:bg-canvas"
              >
                <div className="flex items-center gap-2">
                  <FolderKanban size={14} className="shrink-0 text-brand" />
                  <span className="truncate text-sm font-medium text-ink">{project.name}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted">
                    {project.completedTasks}/{project.totalTasks}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
                  <div
                    className="h-full rounded-full bg-accent-done"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
