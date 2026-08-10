import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Rocket, ListChecks, Users } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard', enabled: true },
  { label: 'Projects', icon: FolderKanban, to: '/projects', enabled: true },
  { label: 'Sprints', icon: Rocket, to: '/sprints', enabled: true },
  { label: 'Tasks', icon: ListChecks, to: '/tasks', enabled: true },
  { label: 'Team', icon: Users, to: '/team', enabled: true },
];

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border-app bg-surface md:flex">
      <div className="flex h-16 items-center gap-2 px-6">
        <img src="/Gemini_Generated_Image_luqy9luqy9luqy9l.png" alt="IPM logo" className="h-8 w-8 rounded object-cover" />
        <span className="font-display text-lg font-semibold text-ink">IPM</span>
      </div>

      <nav className="flex flex-col gap-0.5 px-3 py-2">
        {NAV_ITEMS.map(({ label, icon: Icon, to, enabled }) =>
          enabled ? (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                  ? 'bg-brand-light text-brand-dark'
                  : 'text-muted hover:bg-canvas hover:text-ink'
                }`
              }
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </NavLink>
          ) : null,
        )}
      </nav>
    </aside>
  );
}
