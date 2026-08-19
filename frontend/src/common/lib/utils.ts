export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

const AVATAR_PALETTE = ['#0c66e4', '#1f9d7c', '#e8a33d', '#d64545', '#7c5cff', '#0f9b8e'];

export function avatarColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

export function formatDueDate(isoDate: string): { label: string; isOverdue: boolean } {
  const due = new Date(`${isoDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0) return { label: 'Overdue', isOverdue: true };
  if (diffDays === 0) return { label: 'Due today', isOverdue: false };
  if (diffDays === 1) return { label: 'Due tomorrow', isOverdue: false };
  if (diffDays <= 6) return { label: `Due in ${diffDays} days`, isOverdue: false };
  return {
    label: `Due ${due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    isOverdue: false,
  };
}

export function formatRelativeTime(isoDateTime: string): string {
  const diffMinutes = Math.round((Date.now() - new Date(isoDateTime).getTime()) / 60_000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.round(diffHours / 24)}d ago`;
}
