import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, ChevronDown, CheckCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getInitials, avatarColorForName } from '../../lib/utils';
import { formatRelativeTime } from '../../lib/utils';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationDto,
} from '../../lib/notificationsApi';

export function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await listNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll every 30s
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  async function handleClickNotification(notif: NotificationDto) {
    try {
      if (!notif.isRead) {
        await markNotificationRead(notif.id);
      }
    } catch { /* best-effort */ }
    setNotifOpen(false);
    if (notif.taskId) {
      navigate(`/tasks/${notif.taskId}`);
    }
    await fetchNotifications();
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      await fetchNotifications();
    } catch { /* best-effort */ }
  }

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
        {/* Notifications bell */}
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-full p-2 text-ink/70 hover:bg-white/60"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <button
                aria-hidden="true"
                tabIndex={-1}
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setNotifOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-border-app bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-border-app px-4 py-2.5">
                  <h4 className="text-sm font-semibold text-ink">Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="flex items-center gap-1 text-[11px] text-brand hover:underline"
                      aria-label="Mark all notifications as read"
                    >
                      <CheckCheck size={12} />
                      Mark all read
                    </button>
                  )}
                </div>
                <ul className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <li className="px-4 py-6 text-center text-xs text-muted">No notifications yet</li>
                  ) : (
                    notifications.slice(0, 15).map((notif) => (
                      <li key={notif.id}>
                        <button
                          type="button"
                          onClick={() => handleClickNotification(notif)}
                          className={`flex w-full items-start gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-canvas ${
                            !notif.isRead ? 'bg-brand/5' : ''
                          }`}
                          aria-label={`Notification: ${notif.message}`}
                        >
                          {!notif.isRead && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs ${!notif.isRead ? 'font-medium text-ink' : 'text-ink/80'}`}>
                              {notif.message}
                            </p>
                            <p className="mt-0.5 text-[10px] text-muted">{formatRelativeTime(notif.createdAt)}</p>
                          </div>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* User menu */}
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
