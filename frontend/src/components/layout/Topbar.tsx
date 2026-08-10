import { useState } from 'react';
import { Search, Bell, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getInitials, avatarColorForName } from '../../lib/utils';

export function Topbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border-app bg-topbar px-6">
      <div className="flex max-w-md flex-1 items-center gap-2 rounded-lg border border-transparent bg-white/70 px-3 py-1.5 text-sm text-muted focus-within:border-brand">
        <Search size={15} />
        <input
          type="text"
          placeholder="Search tasks, projects…"
          className="w-full bg-transparent outline-none placeholder:text-muted"
        />
        <kbd className="rounded border border-border-app bg-white px-1.5 py-0.5 font-mono text-[10px] text-muted">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-full p-2 text-ink/70 hover:bg-white/60"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-danger" />
        </button>

        <div className="relative">
          <button
            type="button"
            aria-label="Open user menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg py-1 pr-1 pl-1.5 hover:bg-white/60"
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-medium text-white"
              style={{ backgroundColor: avatarColorForName(user.fullName) }}
            >
              {getInitials(user.fullName)}
            </span>
            <span className="hidden text-sm font-medium text-ink sm:inline">
              {user.fullName.split(' ')[0]}
            </span>
            <ChevronDown size={14} className="text-muted" />
          </button>

          {menuOpen && (
            <>
              <button
                aria-hidden="true"
                tabIndex={-1}
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-border-app bg-white py-1 shadow-lg">
                <div className="border-b border-border-app px-3 py-2">
                  <p className="truncate text-sm font-medium text-ink">{user.fullName}</p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-canvas"
                >
                  <LogOut size={14} />
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
