import { useEffect, useState } from 'react';
import { AppShell } from '../../../common/components/layout/AppShell';
import { listUsers, setUserActive, type UserDto } from '../api/usersApi';
import { extractErrorMessage } from '../../../common/lib/api';
import { useAuth } from '../../../common/context/AuthContext';
import { getInitials, avatarColorForName } from '../../../common/lib/utils';
import { AlertCircle, Search, Shield, ShieldOff } from 'lucide-react';

export function TeamDirectory() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<number | null>(null);

  async function fetchUsers() {
    try {
      setError(null);
      const data = await listUsers();
      setUsers(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  async function handleToggleActive(userId: number, currentlyActive: boolean) {
    setBusy(userId);
    try {
      await setUserActive(userId, !currentlyActive);
      await fetchUsers();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Team Directory</h1>
          <p className="text-sm text-muted">Everyone registered in the workspace.</p>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-border-light bg-white py-2 pl-9 pr-4 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 sm:w-64"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-app border-t-brand" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`flex items-center gap-4 rounded-lg border bg-surface p-4 transition-all hover:shadow-sm ${
                user.isActive === false
                  ? 'border-danger/30 opacity-60'
                  : 'border-border-app hover:border-brand/30'
              }`}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold text-white shadow-sm"
                style={{ backgroundColor: avatarColorForName(user.fullName) }}
              >
                {getInitials(user.fullName)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium text-ink">{user.fullName}</h3>
                <p className="truncate text-xs text-muted">{user.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  {user.role && (
                    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                      user.role === 'admin'
                        ? 'bg-brand-light text-brand-dark'
                        : 'bg-canvas text-muted'
                    }`}>
                      {user.role}
                    </span>
                  )}
                  {user.isActive === false && (
                    <span className="inline-block rounded bg-danger/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-danger">
                      Deactivated
                    </span>
                  )}
                </div>
              </div>

              {/* Admin controls — don't show for your own account */}
              {isAdmin && user.id !== currentUser?.id && (
                <button
                  onClick={() => handleToggleActive(user.id, user.isActive !== false)}
                  disabled={busy === user.id}
                  title={user.isActive !== false ? 'Deactivate account' : 'Reactivate account'}
                  className={`shrink-0 rounded-md p-2 text-xs transition-colors ${
                    user.isActive !== false
                      ? 'text-muted hover:bg-danger/10 hover:text-danger'
                      : 'text-muted hover:bg-accent-done/10 hover:text-accent-done'
                  } disabled:opacity-30`}
                >
                  {user.isActive !== false ? <ShieldOff size={16} /> : <Shield size={16} />}
                </button>
              )}
            </div>
          ))}
          {filteredUsers.length === 0 && !error && (
            <div className="col-span-full rounded-lg border border-dashed border-border-app p-8 text-center text-sm text-muted">
              No team members found matching your search.
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
